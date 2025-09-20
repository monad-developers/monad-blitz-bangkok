// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import {ERC2981} from "@openzeppelin/contracts/token/common/ERC2981.sol";

contract Once1155TemplateV2 is ERC1155, AccessControl, Pausable, ERC2981 {
    bytes32 public constant DEDICATED_ADMIN_ROLE = keccak256("DEDICATED_ADMIN_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bool private _initialized;
    
    // Storage for name and symbol
    string private _tokenName;
    string private _tokenSymbol;
    
    // Mapping from tokenId to batchId
    mapping(uint256 => uint256) public tokenBatchIds;

    constructor() ERC1155("") {
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
    }

    function name() public view returns (string memory) {
        return _tokenName;
    }

    function symbol() public view returns (string memory) {
        return _tokenSymbol;
    }

    function setURI(string memory newuri) public virtual onlyRole(DEDICATED_ADMIN_ROLE) onlyInitialized {
        _setURI(newuri);
    }

    function pause() public onlyRole(DEDICATED_ADMIN_ROLE) onlyInitialized {
        _pause();
    }

    function unpause() public onlyRole(DEDICATED_ADMIN_ROLE) onlyInitialized {
        _unpause();
    }

    function mint(address account, uint256 id, uint256 amount, bytes memory data, uint256 batchId)
        public
        onlyRole(MINTER_ROLE)
        onlyInitialized
    {
        require(batchId > 0, "BatchId must be greater than 0");
        
        // If tokenId already has a batchId, it must match the provided batchId
        if (tokenBatchIds[id] > 0) {
            require(tokenBatchIds[id] == batchId, "BatchId mismatch for existing tokenId");
        } else {
            tokenBatchIds[id] = batchId;
        }
        
        _mint(account, id, amount, data);
    }

    function mintBatch(address to, uint256[] memory ids, uint256[] memory amounts, bytes memory data, uint256[] memory batchIds)
        public
        onlyRole(MINTER_ROLE)
        onlyInitialized
    {
        require(ids.length == batchIds.length, "Ids and batchIds length mismatch");
        
        // Validate batchId for all tokenIds in the batch
        for (uint256 i = 0; i < ids.length; i++) {
            require(batchIds[i] > 0, "BatchId must be greater than 0");
            
            // If tokenId already has a batchId, it must match the provided batchId
            if (tokenBatchIds[ids[i]] > 0) {
                require(tokenBatchIds[ids[i]] == batchIds[i], "BatchId mismatch for existing tokenId");
            } else {
                tokenBatchIds[ids[i]] = batchIds[i];
            }
        }
        
        _mintBatch(to, ids, amounts, data);
    }

    function _update(address from, address to, uint256[] memory ids, uint256[] memory values)
        internal
        override
    {
        require(!paused(), "ERC1155Pausable: token transfer while paused");
        super._update(from, to, ids, values);
    }

    function getBatchId(uint256 tokenId) public view returns (uint256) {
        return tokenBatchIds[tokenId];
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC1155, AccessControl, ERC2981)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
