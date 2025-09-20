// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title MockRefiller
 * @dev Mock refiller contract that handles auto-refill mechanism
 * @notice This contract receives USDT and sends back tokens to maintain pool balance
 */
contract MockRefiller is Ownable {
    using SafeERC20 for IERC20;

    event RefillRequested(address indexed token, uint256 amount, address indexed luckyBox);
    event RefillCompleted(address indexed token, uint256 amount, address indexed luckyBox);

    constructor(address initialOwner) Ownable(initialOwner) {}

    /**
     * @dev Refill a specific token to the lucky box
     * @param token Address of the token to refill
     * @param amount Amount of tokens to send
     * @param luckyBox Address of the lucky box contract
     */
    function refillToken(address token, uint256 amount, address luckyBox) external onlyOwner {
        require(token != address(0), "Invalid token address");
        require(luckyBox != address(0), "Invalid lucky box address");
        require(amount > 0, "Amount must be greater than 0");

        IERC20 tokenContract = IERC20(token);
        uint256 balance = tokenContract.balanceOf(address(this));
        require(balance >= amount, "Insufficient token balance");

        emit RefillRequested(token, amount, luckyBox);

        // Transfer token to lucky box
        tokenContract.safeTransfer(luckyBox, amount);

        emit RefillCompleted(token, amount, luckyBox);
    }

    /**
     * @dev Emergency function to withdraw tokens
     * @param token Address of the token to withdraw
     * @param amount Amount of tokens to withdraw
     * @param to Address to send tokens to
     */
    function emergencyWithdraw(address token, uint256 amount, address to) external onlyOwner {
        require(token != address(0), "Invalid token address");
        require(to != address(0), "Invalid recipient address");
        require(amount > 0, "Amount must be greater than 0");

        IERC20 tokenContract = IERC20(token);
        uint256 balance = tokenContract.balanceOf(address(this));
        require(balance >= amount, "Insufficient balance");

        tokenContract.safeTransfer(to, amount);
    }

    /**
     * @dev Get token balance
     * @param token Address of the token
     * @return Balance of the token
     */
    function getTokenBalance(address token) external view returns (uint256) {
        return IERC20(token).balanceOf(address(this));
    }
}
