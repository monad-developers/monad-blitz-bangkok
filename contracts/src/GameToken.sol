// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title GameToken
 * @dev ERC20 token for Monad Code Arena platform
 * Native staking and reward token $GAME
 */
contract GameToken is ERC20, ERC20Burnable, Ownable, Pausable {
    uint256 private constant INITIAL_SUPPLY = 1_000_000_000 * 10**18; // 1 billion tokens
    uint256 private constant MAX_SUPPLY = 10_000_000_000 * 10**18; // 10 billion tokens max
    
    mapping(address => bool) public minters;
    
    event MinterAdded(address indexed minter);
    event MinterRemoved(address indexed minter);
    
    modifier onlyMinter() {
        require(minters[msg.sender], "GameToken: caller is not a minter");
        _;
    }
    
    constructor() ERC20("Game Token", "GAME") {
        _mint(msg.sender, INITIAL_SUPPLY);
    }
    
    /**
     * @dev Add a new minter (e.g., Arena contract for rewards)
     */
    function addMinter(address minter) external onlyOwner {
        require(minter != address(0), "GameToken: minter cannot be zero address");
        minters[minter] = true;
        emit MinterAdded(minter);
    }
    
    /**
     * @dev Remove a minter
     */
    function removeMinter(address minter) external onlyOwner {
        minters[minter] = false;
        emit MinterRemoved(minter);
    }
    
    /**
     * @dev Mint new tokens (only by authorized minters)
     */
    function mint(address to, uint256 amount) external onlyMinter whenNotPaused {
        require(totalSupply() + amount <= MAX_SUPPLY, "GameToken: max supply exceeded");
        _mint(to, amount);
    }
    
    /**
     * @dev Pause token transfers (emergency use)
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause token transfers
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Override transfer to add pause functionality
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override whenNotPaused {
        super._beforeTokenTransfer(from, to, amount);
    }
}