//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "hardhat/console.sol";

/**
 * @title BetMarket
 * @dev A contract for individual betting markets where users can bet on yes/no outcomes
 * @author BetNad
 */
contract BetMarket {
    // Constants
    uint256 public constant BET_AMOUNT = 0.01 ether;

    // State Variables
    address public immutable creator;
    string public question;
    bool public isSettled;
    bool public winner; // true for yes, false for no
    uint256 public totalYesBets;
    uint256 public totalNoBets;
    uint256 public totalBets;

    // Mappings
    mapping(address => uint256) public yesBets; // user => amount bet on yes
    mapping(address => uint256) public noBets; // user => amount bet on no
    mapping(address => bool) public hasClaimed; // user => whether they've claimed rewards

    // Events
    event BetPlaced(address indexed user, bool betOnYes, uint256 amount);
    event MarketSettled(bool winner);
    event RewardClaimed(address indexed user, uint256 amount);

    // Modifiers
    modifier onlyCreator() {
        require(msg.sender == creator, "Only creator can call this function");
        _;
    }

    modifier notSettled() {
        require(!isSettled, "Market is already settled");
        _;
    }

    modifier settled() {
        require(isSettled, "Market is not settled yet");
        _;
    }

    constructor(string memory _question, address _creator) {
        creator = _creator;
        question = _question;
        isSettled = false;
    }

    /**
     * @dev Place a bet on the market
     * @param betOnYes true to bet on yes, false to bet on no
     */
    function placeBet(bool betOnYes) external payable notSettled {
        require(msg.value == BET_AMOUNT, "Must bet exactly 0.01 ETH");

        if (betOnYes) {
            yesBets[msg.sender] += msg.value;
            totalYesBets += msg.value;
        } else {
            noBets[msg.sender] += msg.value;
            totalNoBets += msg.value;
        }

        totalBets += 1;

        emit BetPlaced(msg.sender, betOnYes, msg.value);
    }

    /**
     * @dev Settle the market with the winning outcome
     * @param _winner true for yes wins, false for no wins
     */
    function settleMarket(bool _winner) external onlyCreator notSettled {
        isSettled = true;
        winner = _winner;

        emit MarketSettled(_winner);
    }

    /**
     * @dev Calculate the reward for a user based on their winning bets
     * @param user The address to calculate reward for
     * @return The amount the user can claim
     */
    function calculateReward(address user) public view settled returns (uint256) {
        if (hasClaimed[user]) {
            return 0;
        }

        uint256 userWinningBets = winner ? yesBets[user] : noBets[user];
        if (userWinningBets == 0) {
            return 0;
        }

        uint256 totalWinningBets = winner ? totalYesBets : totalNoBets;
        uint256 totalLosingBets = winner ? totalNoBets : totalYesBets;

        // Calculate reward: original bet + proportional share of losing bets
        return userWinningBets + (userWinningBets * totalLosingBets) / totalWinningBets;
    }

    /**
     * @dev Claim rewards for the caller
     */
    function claimReward() external settled {
        require(!hasClaimed[msg.sender], "Already claimed");

        uint256 reward = calculateReward(msg.sender);
        require(reward > 0, "No rewards to claim");

        hasClaimed[msg.sender] = true;

        (bool success, ) = msg.sender.call{ value: reward }("");
        require(success, "Failed to send reward");

        emit RewardClaimed(msg.sender, reward);
    }

    /**
     * @dev Get user's bet history
     * @param user The address to get bet history for
     * @return yesAmount Amount bet on yes
     * @return noAmount Amount bet on no
     * @return totalAmount Total amount bet
     */
    function getUserBets(
        address user
    ) external view returns (uint256 yesAmount, uint256 noAmount, uint256 totalAmount) {
        yesAmount = yesBets[user];
        noAmount = noBets[user];
        totalAmount = yesAmount + noAmount;
    }

    /**
     * @dev Get pending claim amount for a user
     * @param user The address to check
     * @return The amount the user can claim
     */
    function getPendingClaim(address user) external view returns (uint256) {
        if (!isSettled) {
            return 0;
        }
        return calculateReward(user);
    }

    /**
     * @dev Get market statistics
     * @return _totalYesBets Total amount bet on yes
     * @return _totalNoBets Total amount bet on no
     * @return _totalBets Total number of bets
     * @return _isSettled Whether market is settled
     * @return _winner The winning outcome (if settled)
     */
    function getMarketStats()
        external
        view
        returns (uint256 _totalYesBets, uint256 _totalNoBets, uint256 _totalBets, bool _isSettled, bool _winner)
    {
        _totalYesBets = totalYesBets;
        _totalNoBets = totalNoBets;
        _totalBets = totalBets;
        _isSettled = isSettled;
        _winner = winner;
    }

    /**
     * @dev Get the question string
     * @return The market question
     */
    function getQuestion() external view returns (string memory) {
        return question;
    }

    /**
     * @dev Receive function to accept ETH
     */
    receive() external payable {}
}
