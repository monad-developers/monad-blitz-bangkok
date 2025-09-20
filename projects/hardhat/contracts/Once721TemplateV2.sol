// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import {ERC2981} from "@openzeppelin/contracts/token/common/ERC2981.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

contract Once721TemplateV2 is ERC721, AccessControl, Pausable, ERC2981 {
    bytes32 public constant DEDICATED_ADMIN_ROLE = keccak256("DEDICATED_ADMIN_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    uint256 private _nextTokenId;
    string private _baseUri;
    bool private _initialized;
    
    // Storage for name and symbol (to override ERC721)
    string private _tokenName;
    string private _tokenSymbol;
    
    // Mapping from tokenId to batchId
    mapping(uint256 => uint256) public tokenBatchIds;

    constructor() ERC721("Template", "TPL") {
        // Template constructor - will be overridden by initialize
    }

    modifier onlyInitialized() {
        require(_initialized, "Not initialized");
        _;
    }

    function initialize(
        string memory name_,
        string memory symbol_,
        address owner,
        address minter,
        address royaltyRecipient,
        uint96 feeNumerator
    ) external {
        require(!_initialized, "Already initialized");
        _initialized = true;
        
        // Set name and symbol
        _tokenName = name_;
        _tokenSymbol = symbol_;
        
        // Setup roles
        _grantRole(DEFAULT_ADMIN_ROLE, owner);
        _grantRole(DEDICATED_ADMIN_ROLE, owner);
        _grantRole(MINTER_ROLE, minter);
        
        // Setup royalty
        _setDefaultRoyalty(royaltyRecipient, feeNumerator);
        
        // Initialize token counter
        _nextTokenId = 1;
    }

    // Override name and symbol to use initialized values
    function name() public view override returns (string memory) {
        return _initialized ? _tokenName : super.name();
    }

    function symbol() public view override returns (string memory) {
        return _initialized ? _tokenSymbol : super.symbol();
    }

    function pause() public onlyRole(DEDICATED_ADMIN_ROLE) onlyInitialized {
        _pause();
    }

    function unpause() public onlyRole(DEDICATED_ADMIN_ROLE) onlyInitialized {
        _unpause();
    }

    function setBaseURI(string memory newuri) public virtual onlyRole(DEDICATED_ADMIN_ROLE) onlyInitialized {
        _baseUri = newuri;
    }

    function safeMint(address to, uint256 batchId) public onlyRole(MINTER_ROLE) onlyInitialized {
        require(batchId > 0, "BatchId must be greater than 0");
        uint256 tokenId = _nextTokenId++;
        tokenBatchIds[tokenId] = batchId;
        _safeMint(to, tokenId);
    }

    function _update(address to, uint256 tokenId, address auth)
        internal
        override
        returns (address)
    {
        require(!paused(), "ERC721Pausable: token transfer while paused");
        return super._update(to, tokenId, auth);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override
        returns (string memory)
    {
        require(_ownerOf(tokenId) != address(0), "ERC721: URI query for nonexistent token");
        return bytes(_baseUri).length > 0 ? string.concat(_baseUri, Strings.toString(tokenId)) : "";
    }

    function getBatchId(uint256 tokenId) public view returns (uint256) {
        require(_ownerOf(tokenId) != address(0), "ERC721: query for nonexistent token");
        return tokenBatchIds[tokenId];
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, AccessControl, ERC2981)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
