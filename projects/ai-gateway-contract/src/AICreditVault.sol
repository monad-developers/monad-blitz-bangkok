// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title AICreditVault - user credit ledger with admin balance
/// @notice Users deposit native MON as credit; backend can move user credit to admin balance; users can withdraw unused credit.
contract AICreditVault {
    /*//////////////////////////////////////////////////////////////
                                ERRORS
    //////////////////////////////////////////////////////////////*/
    error ZeroAddress();
    error NotAuthorized();
    error InvalidAmount();
    error InsufficientBalance();
    error TransferFailed();

    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/
    event Deposit(address indexed user, uint256 amount, uint256 newBalance);
    event Withdraw(address indexed user, uint256 amount, uint256 newBalance);
    event ChargeToAdmin(address indexed user, uint256 amount, uint256 userNewBalance, uint256 adminNewBalance, bytes32 requestId, string memo);
    event AdminWithdraw(address indexed to, uint256 amount);
    event BackendSet(address indexed backend, bool enabled);
    event OwnerChanged(address indexed oldOwner, address indexed newOwner);
    event TreasuryChanged(address indexed oldTreasury, address indexed newTreasury);

    /*//////////////////////////////////////////////////////////////
                                STORAGE
    //////////////////////////////////////////////////////////////*/
    address public owner;                    // contract owner
    address payable public treasury;         // where admin balance is withdrawn to
    mapping(address => uint256) public balanceOf; // user credits (wei)
    uint256 public adminBalance;             // accumulated charges (wei)
    mapping(address => bool) public isBackend;    // authorized chargers

    /*//////////////////////////////////////////////////////////////
                              REENTRANCY GUARD
    //////////////////////////////////////////////////////////////*/
    uint256 private _entered; // 0 = not entered, 1 = entered
    modifier nonReentrant() {
        require(_entered == 0, "REENTRANCY");
        _entered = 1;
        _;
        _entered = 0;
    }

    /*//////////////////////////////////////////////////////////////
                               MODIFIERS
    //////////////////////////////////////////////////////////////*/
    modifier onlyOwner() {
        if (msg.sender != owner) revert NotAuthorized();
        _;
    }

    modifier onlyBackend() {
        if (!isBackend[msg.sender]) revert NotAuthorized();
        _;
    }

    /*//////////////////////////////////////////////////////////////
                               CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/
    constructor(address payable _treasury, address _owner) {
        if (_treasury == address(0) || _owner == address(0)) revert ZeroAddress();
        treasury = _treasury;
        owner = _owner;
        emit TreasuryChanged(address(0), _treasury);
        emit OwnerChanged(address(0), _owner);
    }

    /*//////////////////////////////////////////////////////////////
                               ADMIN OPS
    //////////////////////////////////////////////////////////////*/
    function setOwner(address _owner) external onlyOwner {
        if (_owner == address(0)) revert ZeroAddress();
        emit OwnerChanged(owner, _owner);
        owner = _owner;
    }

    function setTreasury(address payable _treasury) external onlyOwner {
        if (_treasury == address(0)) revert ZeroAddress();
        emit TreasuryChanged(treasury, _treasury);
        treasury = _treasury;
    }

    function setBackend(address _backend, bool _enabled) external onlyOwner {
        if (_backend == address(0)) revert ZeroAddress();
        isBackend[_backend] = _enabled;
        emit BackendSet(_backend, _enabled);
    }

    /// @notice Owner withdraws accumulated admin balance to the treasury
    function withdrawAdmin(uint256 amount) external onlyOwner nonReentrant {
        if (amount == 0) revert InvalidAmount();
        if (adminBalance < amount) revert InsufficientBalance();
        unchecked {
            adminBalance -= amount; // effects
        }
        (bool ok, ) = treasury.call{value: amount}("");
        if (!ok) revert TransferFailed();
        emit AdminWithdraw(treasury, amount);
    }

    /*//////////////////////////////////////////////////////////////
                                USERS
    //////////////////////////////////////////////////////////////*/

    /// @notice Deposit native MON as credit for the sender.
    function deposit() public payable {
        if (msg.value == 0) revert InvalidAmount();
        balanceOf[msg.sender] += msg.value;
        emit Deposit(msg.sender, msg.value, balanceOf[msg.sender]);
    }

    /// @notice Withdraw unused credit back to the sender.
    function withdraw(uint256 amount) external nonReentrant {
        if (amount == 0) revert InvalidAmount();
        uint256 bal = balanceOf[msg.sender];
        if (bal < amount) revert InsufficientBalance();
        unchecked {
            balanceOf[msg.sender] = bal - amount; // effects first
        }
        (bool ok, ) = payable(msg.sender).call{value: amount}("");
        if (!ok) revert TransferFailed();
        emit Withdraw(msg.sender, amount, balanceOf[msg.sender]);
    }

    /*//////////////////////////////////////////////////////////////
                                BACKEND
    //////////////////////////////////////////////////////////////*/

    /// @notice Move `amount` of user's credit to admin balance (no immediate transfer).
    /// @dev Called by authorized backend after a successful AI API call.
    /// @param user      The credited user to deduct from.
    /// @param amount    Amount in wei to move.
    /// @param requestId Correlation id for your backend (indexed off-chain).
    /// @param memo      Optional short note (model, tokens, etc.).
    function chargeToAdmin(
        address user,
        uint256 amount,
        bytes32 requestId,
        string calldata memo
    ) external onlyBackend {
        if (user == address(0)) revert ZeroAddress();
        if (amount == 0) revert InvalidAmount();

        uint256 ubal = balanceOf[user];
        if (ubal < amount) revert InsufficientBalance();

        unchecked {
            balanceOf[user] = ubal - amount;      // decrease user credit
            adminBalance += amount;               // increase admin pool
        }

        emit ChargeToAdmin(user, amount, balanceOf[user], adminBalance, requestId, memo);
    }

    /*//////////////////////////////////////////////////////////////
                         RECEIVE / FALLBACK
    //////////////////////////////////////////////////////////////*/

    /// @notice Credit msg.sender if they send MON directly.
    receive() external payable {
        if (msg.value == 0) revert InvalidAmount();
        balanceOf[msg.sender] += msg.value;
        emit Deposit(msg.sender, msg.value, balanceOf[msg.sender]);
    }

    fallback() external payable {
        if (msg.value > 0) {
            balanceOf[msg.sender] += msg.value;
            emit Deposit(msg.sender, msg.value, balanceOf[msg.sender]);
        }
    }
}
