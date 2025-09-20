// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockUSDT
 * @dev Mock USDT token for testing purposes
 * @notice This is a test token with 6 decimals like real USDT
 */
contract MockUSDT is ERC20, Ownable {
    uint8 private constant _DECIMALS = 6;

    constructor(address initialOwner) ERC20("Mock USDT", "USDT") Ownable(initialOwner) {
        // Mint 1,000,000 USDT to the owner
        _mint(initialOwner, 1000000 * 10**_DECIMALS);
    }

    function decimals() public pure override returns (uint8) {
        return _DECIMALS;
    }

    /**
     * @dev Mint tokens to a specific address (for testing)
     * @param to Address to mint tokens to
     * @param amount Amount of tokens to mint
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}
