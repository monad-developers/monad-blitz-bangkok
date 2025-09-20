//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "./BetMarket.sol";
import "hardhat/console.sol";

/**
 * @title BetFactory
 * @dev Factory contract for creating and managing betting markets
 * @author BetNad
 */
contract BetFactory {
    // State Variables
    address public immutable owner;
    address[] public markets;
    mapping(address => bool) public isMarket;
    mapping(address => address[]) public userMarkets; // user => array of markets they created

    // Events
    event MarketCreated(address indexed market, address indexed creator, string question);
    event MarketSettled(address indexed market, bool winner);

    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    /**
     * @dev Create a new betting market
     * @param question The question for the betting market
     * @return The address of the created market
     */
    function createMarket(string memory question) external returns (address) {
        BetMarket newMarket = new BetMarket(question, msg.sender);
        address marketAddress = address(newMarket);

        markets.push(marketAddress);
        isMarket[marketAddress] = true;
        userMarkets[msg.sender].push(marketAddress);

        emit MarketCreated(marketAddress, msg.sender, question);

        return marketAddress;
    }

    /**
     * @dev Get all active (non-settled) markets
     * @return Array of active market addresses
     */
    function getActiveMarkets() external view returns (address[] memory) {
        uint256 activeCount = 0;

        // First pass: count active markets
        for (uint256 i = 0; i < markets.length; i++) {
            if (isMarket[markets[i]]) {
                BetMarket market = BetMarket(payable(markets[i]));
                (, , , , bool isSettled) = market.getMarketStats();
                if (!isSettled) {
                    activeCount++;
                }
            }
        }

        // Second pass: populate array
        address[] memory activeMarkets = new address[](activeCount);
        uint256 index = 0;

        for (uint256 i = 0; i < markets.length; i++) {
            if (isMarket[markets[i]]) {
                BetMarket market = BetMarket(payable(markets[i]));
                (, , , , bool isSettled) = market.getMarketStats();
                if (!isSettled) {
                    activeMarkets[index] = markets[i];
                    index++;
                }
            }
        }

        return activeMarkets;
    }

    /**
     * @dev Get all markets created by a specific user
     * @param user The address of the user
     * @return Array of market addresses created by the user
     */
    function getUserMarkets(address user) external view returns (address[] memory) {
        return userMarkets[user];
    }

    /**
     * @dev Get all markets (active and settled)
     * @return Array of all market addresses
     */
    function getAllMarkets() external view returns (address[] memory) {
        return markets;
    }

    /**
     * @dev Get market count
     * @return Total number of markets created
     */
    function getMarketCount() external view returns (uint256) {
        return markets.length;
    }

    /**
     * @dev Get active market count
     * @return Number of active (non-settled) markets
     */
    function getActiveMarketCount() external view returns (uint256) {
        uint256 activeCount = 0;

        for (uint256 i = 0; i < markets.length; i++) {
            if (isMarket[markets[i]]) {
                BetMarket market = BetMarket(payable(markets[i]));
                (, , , , bool isSettled) = market.getMarketStats();
                if (!isSettled) {
                    activeCount++;
                }
            }
        }

        return activeCount;
    }

    /**
     * @dev Get market details by index
     * @param index The index of the market in the markets array
     * @return marketAddress The address of the market
     * @return question The question of the market
     * @return isActive Whether the market is active (not settled)
     */
    function getMarketByIndex(
        uint256 index
    ) external view returns (address marketAddress, string memory question, bool isActive) {
        require(index < markets.length, "Index out of bounds");

        marketAddress = markets[index];
        if (isMarket[marketAddress]) {
            BetMarket market = BetMarket(payable(marketAddress));
            question = market.getQuestion();
            (, , , , bool isSettled) = market.getMarketStats();
            isActive = !isSettled;
        } else {
            question = "";
            isActive = false;
        }
    }

    /**
     * @dev Get user's bet history across all markets
     * @param user The address of the user
     * @return marketAddresses Array of market addresses where user has bets
     * @return yesAmounts Array of amounts bet on yes for each market
     * @return noAmounts Array of amounts bet on no for each market
     * @return totalAmounts Array of total amounts bet for each market
     */
    function getUserBetHistory(
        address user
    )
        external
        view
        returns (
            address[] memory marketAddresses,
            uint256[] memory yesAmounts,
            uint256[] memory noAmounts,
            uint256[] memory totalAmounts
        )
    {
        // First pass: count markets where user has bets
        uint256 betCount = 0;
        for (uint256 i = 0; i < markets.length; i++) {
            if (isMarket[markets[i]]) {
                BetMarket market = BetMarket(payable(markets[i]));
                (uint256 yesAmount, uint256 noAmount, ) = market.getUserBets(user);
                if (yesAmount > 0 || noAmount > 0) {
                    betCount++;
                }
            }
        }

        // Initialize arrays
        marketAddresses = new address[](betCount);
        yesAmounts = new uint256[](betCount);
        noAmounts = new uint256[](betCount);
        totalAmounts = new uint256[](betCount);

        // Second pass: populate arrays
        uint256 index = 0;
        for (uint256 i = 0; i < markets.length; i++) {
            if (isMarket[markets[i]]) {
                BetMarket market = BetMarket(payable(markets[i]));
                (uint256 yesAmount, uint256 noAmount, uint256 totalAmount) = market.getUserBets(user);
                if (yesAmount > 0 || noAmount > 0) {
                    marketAddresses[index] = markets[i];
                    yesAmounts[index] = yesAmount;
                    noAmounts[index] = noAmount;
                    totalAmounts[index] = totalAmount;
                    index++;
                }
            }
        }
    }

    /**
     * @dev Get user's pending claims across all markets
     * @param user The address of the user
     * @return marketAddresses Array of market addresses where user has pending claims
     * @return claimAmounts Array of claimable amounts for each market
     */
    function getUserPendingClaims(
        address user
    ) external view returns (address[] memory marketAddresses, uint256[] memory claimAmounts) {
        // First pass: count markets where user has pending claims
        uint256 claimCount = 0;
        for (uint256 i = 0; i < markets.length; i++) {
            if (isMarket[markets[i]]) {
                BetMarket market = BetMarket(payable(markets[i]));
                uint256 pendingClaim = market.getPendingClaim(user);
                if (pendingClaim > 0) {
                    claimCount++;
                }
            }
        }

        // Initialize arrays
        marketAddresses = new address[](claimCount);
        claimAmounts = new uint256[](claimCount);

        // Second pass: populate arrays
        uint256 index = 0;
        for (uint256 i = 0; i < markets.length; i++) {
            if (isMarket[markets[i]]) {
                BetMarket market = BetMarket(payable(markets[i]));
                uint256 pendingClaim = market.getPendingClaim(user);
                if (pendingClaim > 0) {
                    marketAddresses[index] = markets[i];
                    claimAmounts[index] = pendingClaim;
                    index++;
                }
            }
        }
    }

    /**
     * @dev Claim all pending rewards for a user across all markets
     * @param user The address of the user
     * @return totalClaimed Total amount claimed across all markets
     */
    function claimAllRewards(address user) external returns (uint256 totalClaimed) {
        totalClaimed = 0;

        for (uint256 i = 0; i < markets.length; i++) {
            if (isMarket[markets[i]]) {
                BetMarket market = BetMarket(payable(markets[i]));
                uint256 pendingClaim = market.getPendingClaim(user);
                if (pendingClaim > 0) {
                    try market.claimReward() {
                        totalClaimed += pendingClaim;
                    } catch {
                        // Continue to next market if claim fails
                        continue;
                    }
                }
            }
        }
    }

    /**
     * @dev Emergency function to remove a market (only owner)
     * @param marketAddress The address of the market to remove
     */
    function removeMarket(address marketAddress) external onlyOwner {
        require(isMarket[marketAddress], "Market does not exist");
        isMarket[marketAddress] = false;
    }

    /**
     * @dev Get contract balance (for emergency purposes)
     * @return The balance of the factory contract
     */
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @dev Emergency withdraw function (only owner)
     */
    function emergencyWithdraw() external onlyOwner {
        (bool success, ) = owner.call{ value: address(this).balance }("");
        require(success, "Failed to send Ether");
    }

    /**
     * @dev Receive function to accept ETH
     */
    receive() external payable {}
}
