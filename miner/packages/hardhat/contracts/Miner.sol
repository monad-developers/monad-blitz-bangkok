//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

// Useful for debugging. Remove when deploying to a live network.
import "hardhat/console.sol";

/**
 * A smart contract that allows users to start mining and complete mining after a claim period
 * @author BuidlGuidl
 */
contract Miner {
    // State Variables
    address public immutable owner;
    bool public isMiningStarted = false;
    uint256 public claimTime = 0;
    uint256 public constant CLAIM_PERIOD = 10; // 10 seconds

    // Events
    event MiningStarted(address indexed miner, uint256 claimTime);
    event MiningCompleted(address indexed miner, uint256 completionTime);

    // Constructor
    constructor(address _owner) {
        owner = _owner;
    }

    // Modifier: used to define a set of rules that must be met before or after a function is executed
    modifier isOwner() {
        require(msg.sender == owner, "Not the Owner");
        _;
    }

    /**
     * Function that allows anyone to start mining
     * Can only be called if mining hasn't started yet
     * Sets the claim time to 10 seconds from now
     */
    function startMine() public {
        require(!isMiningStarted, "Mining has already started");

        isMiningStarted = true;
        claimTime = block.timestamp + CLAIM_PERIOD;

        console.log("Mining started by %s, claim time set to %s", msg.sender, claimTime);

        emit MiningStarted(msg.sender, claimTime);
    }

    /**
     * Function that allows anyone to complete mining
     * Can only be called if mining has started and the claim period has passed
     */
    function completeMine() public {
        require(isMiningStarted, "Mining has not started yet");
        require(block.timestamp >= claimTime, "Claim period has not passed yet");

        console.log("Mining completed by %s at %s", msg.sender, block.timestamp);

        emit MiningCompleted(msg.sender, block.timestamp);

        // Reset mining state to allow starting again
        isMiningStarted = false;
        claimTime = 0;
    }

    /**
     * Function that allows the contract to receive ETH
     */
    receive() external payable {}
}
