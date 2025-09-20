// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title FlickShare (Monad native MON only)
/// @notice Community movie-review contract with tipping in native MON and per-review accounting
contract FlickTest is Ownable, ReentrancyGuard {
    /// @notice Developer payout address (receives dev fee portion of supports)
    address public devAddress;

    /// @notice Total number of reviews created (monotonic)
    uint256 public reviewCounter;

    /// @notice Accumulated dev earnings (in native MON, wei)
    uint256 public totalDevEarnings;

    /// @notice Minimum and maximum allowed fee in basis points for support (5% - 20%)
    uint256 public constant MIN_FEE_BPS = 500;
    uint256 public constant MAX_FEE_BPS = 2000;

    struct Review {
        uint256 reviewId;
        address reviewer;
        uint256 movieId;
        string reviewText;
        uint8 rating;
        uint256 likeCount;
        uint256 timestamp;
    }

    struct Contribution {
        address supporter;
        uint256 amount; // in wei (native MON)
        uint256 timestamp;
        uint256 reviewId;
    }

    /// @notice reviewId => total support amount (in wei)
    mapping(uint256 => uint256) public reviewSupportAmount;

    mapping(uint256 => Review) public reviews;
    mapping(uint256 => address[]) public reviewSupporters;
    mapping(uint256 => mapping(address => Contribution)) public supporters;
    mapping(uint256 => mapping(address => bool)) public hasLiked;
    mapping(address => uint256) public checkinCount;

    event Supported(
        uint256 indexed reviewId,
        address indexed supporter,
        uint256 amount,
        uint256 feeBps,
        uint256 devFee,
        uint256 reviewerAmount
    );

    event DevWithdrawn(address indexed dev, uint256 amount);
    event DevAddressUpdated(address indexed previousDev, address indexed newDev);
    event ReviewLiked(uint256 indexed reviewId, address indexed liker, uint256 newLikeCount);
    event ReviewAdded(
        address indexed reviewer,
        uint256 indexed movieId,
        uint256 indexed reviewId,
        string reviewText,
        uint256 timestamp,
        uint8 rating
    );
    event CheckinSuccessful(address indexed user);

    constructor(address _devAddress) Ownable(msg.sender){
        require(_devAddress != address(0), "dev=0");
        devAddress = _devAddress;
        // Ownable sets owner to msg.sender automatically
    }

    // ---------- Public/external API ----------
    /// @notice Create a review (native-MON only, no preferred token)
    function createReview(
        uint256 _movieId,
        string calldata _reviewText,
        uint8 _rating
    ) external returns (uint256) {
        require(_rating >= 1 && _rating <= 5, "rating 1-5");

        reviewCounter += 1;
        uint256 id = reviewCounter;

        reviews[id] = Review({
            reviewId: id,
            reviewer: msg.sender,
            movieId: _movieId,
            reviewText: _reviewText,
            rating: _rating,
            likeCount: 0,
            timestamp: block.timestamp
        });

        emit ReviewAdded(
            msg.sender,
            _movieId,
            id,
            _reviewText,
            block.timestamp,
            _rating
        );

        return id;
    }

    /// @notice Support a review by sending native MON (msg.value). feeBps in [5%..20%].
    /// @dev msg.value is the contributed amount (in wei). The dev cut is accumulated and withdrawable.
    function supportReview(uint256 _reviewId, uint256 _feeBps) external payable nonReentrant {
        uint256 _amount = msg.value;
        require(_amount > 0, "amount=0");
        require(_feeBps >= MIN_FEE_BPS && _feeBps <= MAX_FEE_BPS, "fee 5%-20%");

        Review storage r = reviews[_reviewId];
        require(r.reviewer != address(0), "review not found");

        uint256 devCut = (_amount * _feeBps) / 10_000;
        uint256 reviewerCut = _amount - devCut;

        // Track supporter contribution
        Contribution storage c = supporters[_reviewId][msg.sender];
        if (c.amount == 0) {
            reviewSupporters[_reviewId].push(msg.sender);
            c.reviewId = _reviewId;
            c.supporter = msg.sender;
        }
        c.amount += _amount;
        c.timestamp = block.timestamp;

        // Update per-review support total
        reviewSupportAmount[_reviewId] += _amount;

        // Update dev earnings ledger (in native MON)
        totalDevEarnings += devCut;

        // Pay reviewer in native MON immediately
        (bool sentReviewer, ) = payable(r.reviewer).call{value: reviewerCut}("");
        require(sentReviewer, "transfer to reviewer failed");

        emit Supported(_reviewId, msg.sender, _amount, _feeBps, devCut, reviewerCut);
    }

    /// @notice Withdraw accumulated dev earnings (native MON)
    function withdrawDev(uint256 _amount) external nonReentrant {
        require(_amount > 0, "amount=0");
        require(msg.sender == devAddress || msg.sender == owner(), "not authorized");
        require(_amount <= totalDevEarnings, "amount > earnings");

        totalDevEarnings -= _amount;

        (bool sentDev, ) = payable(devAddress).call{value: _amount}("");
        require(sentDev, "dev transfer failed");

        emit DevWithdrawn(devAddress, _amount);
    }

    function likeReview(uint256 _reviewId) external {
        Review storage r = reviews[_reviewId];
        require(r.reviewer != address(0), "review not found");
        require(!hasLiked[_reviewId][msg.sender], "already liked");

        hasLiked[_reviewId][msg.sender] = true;
        r.likeCount += 1;

        emit ReviewLiked(_reviewId, msg.sender, r.likeCount);
    }

    function checkDaily() external {
        address user = msg.sender;
        checkinCount[user] += 1;
        emit CheckinSuccessful(user);
    }

    // ---------- Admin / owner ----------

    function setDevAddress(address _newDev) external onlyOwner {
        require(_newDev != address(0), "dev=0");
        address previous = devAddress;
        devAddress = _newDev;
        emit DevAddressUpdated(previous, _newDev);
    }

    /// @notice Rescue accidental native MON (only owner). Note: this does not touch `totalDevEarnings`.
    function rescueNative(address payable _to, uint256 _amount) external onlyOwner {
        require(_to != payable(address(0)), "to=0");
        (bool sent, ) = _to.call{value: _amount}("");
        require(sent, "rescue transfer failed");
    }

    /// @notice Rescue ERC20 tokens accidentally sent
    function rescueERC20(address _token, address _to, uint256 _amount) external onlyOwner {
        require(_to != address(0), "to=0");
        // Minimal ERC20 interface to transfer tokens out
        (bool success, bytes memory data) = _token.call(abi.encodeWithSignature("transfer(address,uint256)", _to, _amount));
        require(success && (data.length == 0 || abi.decode(data, (bool))), "erc20 transfer failed");
    }

    // Allow contract to receive native MON directly
    receive() external payable {}
    fallback() external payable {}
}
