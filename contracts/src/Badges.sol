// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title Badges
 * @dev ERC1155 NFT contract for achievement badges in Monad Code Arena
 */
contract Badges is ERC1155, Ownable, Pausable {
    using Counters for Counters.Counter;
    
    Counters.Counter private _badgeIdTracker;
    
    struct BadgeInfo {
        string name;
        string description;
        string imageUri;
        uint8 rarity; // 0=Common, 1=Rare, 2=Epic, 3=Legendary
        bool exists;
        uint256 totalMinted;
        uint256 maxSupply; // 0 = unlimited
    }
    
    mapping(uint256 => BadgeInfo) public badges;
    mapping(address => bool) public minters;
    mapping(address => mapping(uint256 => bool)) public playerHasBadge;
    
    // Predefined badge IDs for common achievements
    uint256 public constant FIRST_WIN_BADGE = 1;
    uint256 public constant FIVE_WIN_STREAK_BADGE = 2;
    uint256 public constant TEN_WIN_STREAK_BADGE = 3;
    uint256 public constant HUNDRED_MATCHES_BADGE = 4;
    uint256 public constant SPEED_DEMON_BADGE = 5;
    uint256 public constant GAS_OPTIMIZER_BADGE = 6;
    uint256 public constant CTF_MASTER_BADGE = 7;
    
    event BadgeCreated(
        uint256 indexed badgeId,
        string name,
        uint8 rarity,
        uint256 maxSupply
    );
    
    event BadgeMinted(
        address indexed player,
        uint256 indexed badgeId,
        string badgeName
    );
    
    event MinterAdded(address indexed minter);
    event MinterRemoved(address indexed minter);
    
    modifier onlyMinter() {
        require(minters[msg.sender], "Badges: caller is not a minter");
        _;
    }
    
    modifier badgeExists(uint256 badgeId) {
        require(badges[badgeId].exists, "Badges: badge does not exist");
        _;
    }
    
    constructor(string memory baseUri) ERC1155(baseUri) {
        _initializeDefaultBadges();
    }
    
    /**
     * @dev Initialize default achievement badges
     */
    function _initializeDefaultBadges() private {
        _createBadge(
            FIRST_WIN_BADGE,
            "First Victory",
            "Congratulations on your first win!",
            "first_win.png",
            0, // Common
            0  // Unlimited
        );
        
        _createBadge(
            FIVE_WIN_STREAK_BADGE,
            "Five Strike",
            "Won 5 matches in a row",
            "five_streak.png",
            1, // Rare
            0  // Unlimited
        );
        
        _createBadge(
            TEN_WIN_STREAK_BADGE,
            "Perfect Ten",
            "Won 10 matches in a row",
            "ten_streak.png",
            2, // Epic
            0  // Unlimited
        );
        
        _createBadge(
            HUNDRED_MATCHES_BADGE,
            "Veteran Coder",
            "Completed 100 matches",
            "veteran.png",
            1, // Rare
            0  // Unlimited
        );
        
        _createBadge(
            SPEED_DEMON_BADGE,
            "Speed Demon",
            "Solved challenge in under 30 seconds",
            "speed_demon.png",
            2, // Epic
            0  // Unlimited
        );
        
        _createBadge(
            GAS_OPTIMIZER_BADGE,
            "Gas Optimizer",
            "Won optimization battle with 50%+ gas savings",
            "gas_optimizer.png",
            2, // Epic
            0  // Unlimited
        );
        
        _createBadge(
            CTF_MASTER_BADGE,
            "CTF Master",
            "Won 10 CTF matches",
            "ctf_master.png",
            3, // Legendary
            100 // Limited supply
        );
        
        // Set badge ID counter to continue from predefined badges
        _badgeIdTracker._value = 7;
    }
    
    /**
     * @dev Create a new badge type
     */
    function _createBadge(
        uint256 badgeId,
        string memory name,
        string memory description,
        string memory imageUri,
        uint8 rarity,
        uint256 maxSupply
    ) private {
        require(!badges[badgeId].exists, "Badges: badge already exists");
        require(rarity <= 3, "Badges: invalid rarity");
        
        badges[badgeId] = BadgeInfo({
            name: name,
            description: description,
            imageUri: imageUri,
            rarity: rarity,
            exists: true,
            totalMinted: 0,
            maxSupply: maxSupply
        });
        
        emit BadgeCreated(badgeId, name, rarity, maxSupply);
    }
    
    /**
     * @dev Create a new custom badge (only owner)
     */
    function createCustomBadge(
        string memory name,
        string memory description,
        string memory imageUri,
        uint8 rarity,
        uint256 maxSupply
    ) external onlyOwner returns (uint256 badgeId) {
        _badgeIdTracker.increment();
        badgeId = _badgeIdTracker.current();
        
        _createBadge(badgeId, name, description, imageUri, rarity, maxSupply);
    }
    
    /**
     * @dev Add minter (Arena contract, etc.)
     */
    function addMinter(address minter) external onlyOwner {
        require(minter != address(0), "Badges: invalid minter address");
        minters[minter] = true;
        emit MinterAdded(minter);
    }
    
    /**
     * @dev Remove minter
     */
    function removeMinter(address minter) external onlyOwner {
        minters[minter] = false;
        emit MinterRemoved(minter);
    }
    
    /**
     * @dev Mint badge to player (only minters)
     */
    function mintBadge(
        address player,
        uint256 badgeId
    ) external onlyMinter whenNotPaused badgeExists(badgeId) {
        require(player != address(0), "Badges: invalid player address");
        require(!playerHasBadge[player][badgeId], "Badges: player already has badge");
        
        BadgeInfo storage badge = badges[badgeId];
        
        // Check max supply
        if (badge.maxSupply > 0) {
            require(
                badge.totalMinted < badge.maxSupply,
                "Badges: max supply reached"
            );
        }
        
        // Mint badge (amount = 1 for achievements)
        _mint(player, badgeId, 1, "");
        
        // Update tracking
        playerHasBadge[player][badgeId] = true;
        badge.totalMinted++;
        
        emit BadgeMinted(player, badgeId, badge.name);
    }
    
    /**
     * @dev Batch mint multiple badges to player
     */
    function mintBadgesBatch(
        address player,
        uint256[] memory badgeIds
    ) external onlyMinter whenNotPaused {
        require(player != address(0), "Badges: invalid player address");
        require(badgeIds.length > 0, "Badges: empty badge list");
        
        uint256[] memory amounts = new uint256[](badgeIds.length);
        
        for (uint256 i = 0; i < badgeIds.length; i++) {
            uint256 badgeId = badgeIds[i];
            
            require(badges[badgeId].exists, "Badges: badge does not exist");
            require(!playerHasBadge[player][badgeId], "Badges: player already has badge");
            
            BadgeInfo storage badge = badges[badgeId];
            
            // Check max supply
            if (badge.maxSupply > 0) {
                require(
                    badge.totalMinted < badge.maxSupply,
                    "Badges: max supply reached"
                );
            }
            
            // Update tracking
            playerHasBadge[player][badgeId] = true;
            badge.totalMinted++;
            amounts[i] = 1;
            
            emit BadgeMinted(player, badgeId, badge.name);
        }
        
        // Batch mint
        _mintBatch(player, badgeIds, amounts, "");
    }
    
    /**
     * @dev Get badge information
     */
    function getBadgeInfo(uint256 badgeId) external view returns (BadgeInfo memory) {
        require(badges[badgeId].exists, "Badges: badge does not exist");
        return badges[badgeId];
    }
    
    /**
     * @dev Check if player has specific badge
     */
    function hasBadge(address player, uint256 badgeId) external view returns (bool) {
        return playerHasBadge[player][badgeId];
    }
    
    /**
     * @dev Get all badges owned by player
     */
    function getPlayerBadges(address player) external view returns (uint256[] memory) {
        uint256 totalBadges = _badgeIdTracker.current();
        uint256[] memory tempBadges = new uint256[](totalBadges);
        uint256 count = 0;
        
        for (uint256 i = 1; i <= totalBadges; i++) {
            if (playerHasBadge[player][i]) {
                tempBadges[count] = i;
                count++;
            }
        }
        
        // Create properly sized array
        uint256[] memory playerBadges = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            playerBadges[i] = tempBadges[i];
        }
        
        return playerBadges;
    }
    
    /**
     * @dev Update base URI for metadata
     */
    function setURI(string memory newUri) external onlyOwner {
        _setURI(newUri);
    }
    
    /**
     * @dev Pause contract
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Override transfer to prevent badge trading
     */
    function safeTransferFrom(
        address from,
        address to,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) public pure override {
        revert("Badges: transfers not allowed");
    }
    
    /**
     * @dev Override batch transfer to prevent badge trading
     */
    function safeBatchTransferFrom(
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) public pure override {
        revert("Badges: transfers not allowed");
    }
}