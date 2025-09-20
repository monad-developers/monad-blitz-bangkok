// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";

interface IMint1155 {
    /**
     * @dev Mints tokens to the specified address
     * @param account The address to mint tokens to
     * @param id The token ID to mint
     * @param amount The amount of tokens to mint
     * @param data Additional data with no specified format
     * @param batchId The batch ID to associate with the token
     */
    function mint(address account, uint256 id, uint256 amount, bytes memory data, uint256 batchId) external;
}

interface ISafeMint721 {
    /**
     * @dev Safely mints a new token to the specified address
     * @param to The address to mint the token to
     * @param batchId The batch ID to associate with the token
     */
    function safeMint(address to, uint256 batchId) external;
}

/**
 * @title BatchManager
 * @dev Main contract for managing QR Code batches with Merkle Tree validation
 */
contract BatchManager is AccessControl, Pausable, ReentrancyGuard {
    bytes32 public constant SYSTEM_ADMIN_ROLE = keccak256("SYSTEM_ADMIN_ROLE");
    bytes32 public constant BATCH_FACTORY_ROLE = keccak256("BATCH_FACTORY_ROLE");
    
    // Structs
    struct Batch {
        uint256 batchId;
        address issuer;
        address nftContract;
        bytes32 merkleRoot;
        uint256 totalCodes;
        uint256 claimedCodes;
        uint256 expireTime;
        bool isPaused;
        bool isNFT721; // true for ERC721, false for ERC1155
        mapping(bytes32 => bool) claimedCodeIds; // Use leaf hash as key for gas optimization
        mapping(bytes32 => bool) pausedCodeIds; // Use leaf hash as key for gas optimization
    }

    struct BatchInfo {
        uint256 batchId;
        address issuer;
        address nftContract;
        bytes32 merkleRoot;
        uint256 totalCodes;
        uint256 claimedCodes;
        uint256 expireTime;
        bool isPaused;
        bool isNFT721;
    }

    // State variables
    uint256 private _nextBatchId = 1;
    mapping(uint256 => Batch) public batches;
    mapping(address => bool) public pausedIssuers;
    mapping(address => bool) public globalPausedWallets;
    mapping(uint256 => mapping(address => bool)) public batchPausedWallets;
    mapping(address => uint256[]) public issuerBatches;
    mapping(address => uint256) public walletNonces; // Nonce for each wallet
    
    // TrustedSigner variables
    mapping(address => bool) public trustedSigners;
    mapping(bytes32 => bool) public usedSignatures;

    // Events
    event BatchCreated(
        uint256 indexed batchId,
        address indexed issuer,
        address indexed nftContract,
        bytes32 merkleRoot,
        uint256 totalCodes,
        bool isNFT721
    );
    
    event CodeClaimed(
        uint256 indexed batchId,
        string indexed codeId,
        address indexed claimer
    );
    
    event BatchPaused(uint256 indexed batchId, bool isPaused);
    event IssuerPaused(address indexed issuer, bool isPaused);
    event WalletPaused(address indexed wallet, uint256 indexed batchId, bool isPaused, bool isGlobal);
    event CodePaused(uint256 indexed batchId, string indexed codeId, bool isPaused);
    event BatchExpireTimeSet(uint256 indexed batchId, uint256 expireTime);
    event BatchAdminAdded(uint256 indexed batchId, address indexed admin);
    event BatchAdminRemoved(uint256 indexed batchId, address indexed admin);
    event TrustedSignerAdded(address indexed signer);
    event TrustedSignerRemoved(address indexed signer);
    event SignatureVerified(uint256 indexed batchId, address indexed claimer, address indexed signer);
    event WalletNonceIncremented(address indexed wallet, uint256 newNonce);
    event BatchFactorySet(address indexed batchFactory);
    event BatchFactoryRemoved(address indexed batchFactory);

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(SYSTEM_ADMIN_ROLE, msg.sender);
    }

    // Modifiers
    modifier onlyBatchOwnerOrAdmin(uint256 batchId) {
        require(_isBatchOwnerOrAdmin(batchId, msg.sender), "Not batch owner or admin");
        _;
    }

    modifier onlySystemAdminOrBatchOwnerOrAdmin(uint256 batchId) {
        require(
            hasRole(SYSTEM_ADMIN_ROLE, msg.sender) || _isBatchOwnerOrAdmin(batchId, msg.sender),
            "Not authorized"
        );
        _;
    }

    modifier batchExists(uint256 batchId) {
        require(batchId > 0 && batchId < _nextBatchId, "Batch does not exist");
        _;
    }

    modifier notPausedIssuer(address issuer) {
        require(!pausedIssuers[issuer], "Issuer is paused");
        _;
    }

    modifier notPausedWallet(address wallet, uint256 batchId) {
        require(
            !globalPausedWallets[wallet] && !batchPausedWallets[batchId][wallet],
            "Wallet is paused"
        );
        _;
    }

    // Internal functions
    function _isBatchOwnerOrAdmin(uint256 batchId, address account) internal view returns (bool) {
        return batches[batchId].issuer == account || 
               hasRole(_getBatchAdminRole(batchId), account);
    }

    function _getBatchAdminRole(uint256 batchId) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked("BATCH_ADMIN_ROLE", batchId));
    }

    function _verifyBackendSignature(
        uint256 batchId,
        bytes32 codeHash,
        address to,
        uint256 nftType,
        uint256 tokenId,
        uint256 nonce,
        uint256 deadline,
        bytes memory signature
    ) internal returns (address signer) {
        require(block.timestamp <= deadline, "Signature expired");
        
        // Create the message hash according to the specified format
        bytes32 messageHash = keccak256(abi.encodePacked(
            batchId,
            codeHash,
            to,
            nftType,
            tokenId,
            nonce,
            deadline
        ));
        
        // Create Ethereum signed message hash
        bytes32 ethSignedMessageHash = keccak256(abi.encodePacked(
            "\x19Ethereum Signed Message:\n32",
            messageHash
        ));
        
        // Prevent signature replay
        require(!usedSignatures[ethSignedMessageHash], "Signature already used");
        usedSignatures[ethSignedMessageHash] = true;
        
        // Recover signer
        signer = ECDSA.recover(ethSignedMessageHash, signature);
        require(trustedSigners[signer], "Invalid signer");
        
        return signer;
    }



    // Batch creation (called by BatchFactory)
    function createBatch(
        address issuer,
        address nftContract,
        bytes32 merkleRoot,
        uint256 totalCodes,
        uint256 expireTime,
        bool isNFT721
    ) external onlyRole(BATCH_FACTORY_ROLE) nonReentrant whenNotPaused notPausedIssuer(issuer) returns (uint256) {
        require(issuer != address(0), "Invalid issuer");
        require(nftContract != address(0), "Invalid NFT contract");
        require(merkleRoot != bytes32(0), "Invalid merkle root");
        require(totalCodes > 0, "Total codes must be positive");

        uint256 batchId = _nextBatchId++;
        Batch storage batch = batches[batchId];
        
        batch.batchId = batchId;
        batch.issuer = issuer;
        batch.nftContract = nftContract;
        batch.merkleRoot = merkleRoot;
        batch.totalCodes = totalCodes;
        batch.claimedCodes = 0;
        batch.expireTime = expireTime;
        batch.isPaused = false;
        batch.isNFT721 = isNFT721;

        issuerBatches[issuer].push(batchId);

        emit BatchCreated(batchId, issuer, nftContract, merkleRoot, totalCodes, isNFT721);
        
        return batchId;
    }

    // Claim function
    function claimCode(
        uint256 batchId,
        string memory codeId,
        uint256 tokenId,
        uint256 deadline,
        bytes calldata backendSig,
        bytes32[] memory merkleProof
    ) external 
        nonReentrant
        whenNotPaused 
        batchExists(batchId) 
        notPausedIssuer(batches[batchId].issuer)
        notPausedWallet(msg.sender, batchId)
    {
        Batch storage batch = batches[batchId];
        
        require(!batch.isPaused, "Batch is paused");
        require(batch.expireTime == 0 || block.timestamp <= batch.expireTime, "Batch expired");
        
        // Calculate leaf hash for gas optimization
        bytes32 leaf = keccak256(abi.encodePacked(codeId));
        require(!batch.claimedCodeIds[leaf], "Code already claimed");
        require(!batch.pausedCodeIds[leaf], "Code is paused");

        // Verify merkle proof
        require(MerkleProof.verify(merkleProof, batch.merkleRoot, leaf), "Invalid merkle proof");

        // Validate token parameters based on batch type
        uint256 nftType;
        if (batch.isNFT721) {
            require(tokenId == 0, "TokenId must be 0 for ERC721");
            nftType = 0;
        } else {
            require(tokenId > 0, "TokenId must be > 0 for ERC1155");
            nftType = 1;
        }

        // Verify backend signature using wallet nonce
        bytes32 codeHash = keccak256(abi.encodePacked(codeId));
        uint256 nonce = walletNonces[msg.sender]; // Use wallet-specific nonce
        
        address signer = _verifyBackendSignature(
            batchId,
            codeHash,
            msg.sender,
            nftType,
            tokenId,
            nonce,
            deadline,
            backendSig
        );

        // Mark as claimed
        batch.claimedCodeIds[leaf] = true;
        batch.claimedCodes++;
        
        // Increment wallet nonce
        walletNonces[msg.sender]++;

        emit CodeClaimed(batchId, codeId, msg.sender);
        emit SignatureVerified(batchId, msg.sender, signer);
        emit WalletNonceIncremented(msg.sender, walletNonces[msg.sender]);

        // Mint NFT (1 NFT per claim)
        if (batch.isNFT721) {
            ISafeMint721(batch.nftContract).safeMint(msg.sender, batchId);
        } else {
            IMint1155(batch.nftContract).mint(
                msg.sender,
                tokenId, // Use provided tokenId for ERC1155
                1, // Mint 1 token per claim
                "",
                batchId
            );
        }
    }

    // Admin functions
    function pauseBatch(uint256 batchId, bool isPaused) 
        external 
        batchExists(batchId) 
        onlySystemAdminOrBatchOwnerOrAdmin(batchId) 
    {
        batches[batchId].isPaused = isPaused;
        emit BatchPaused(batchId, isPaused);
    }

    function pauseIssuer(address issuer, bool isPaused) external onlyRole(SYSTEM_ADMIN_ROLE) {
        pausedIssuers[issuer] = isPaused;
        emit IssuerPaused(issuer, isPaused);
    }

    function pauseWalletGlobally(address wallet, bool isPaused) external onlyRole(SYSTEM_ADMIN_ROLE) {
        globalPausedWallets[wallet] = isPaused;
        emit WalletPaused(wallet, 0, isPaused, true);
    }

    function pauseWalletInBatch(uint256 batchId, address wallet, bool isPaused) 
        external 
        batchExists(batchId) 
        onlySystemAdminOrBatchOwnerOrAdmin(batchId) 
    {
        batchPausedWallets[batchId][wallet] = isPaused;
        emit WalletPaused(wallet, batchId, isPaused, false);
    }

    function pauseCodeInBatch(uint256 batchId, string memory codeId, bool isPaused) 
        external 
        batchExists(batchId) 
        onlySystemAdminOrBatchOwnerOrAdmin(batchId) 
    {
        bytes32 leaf = keccak256(abi.encodePacked(codeId));
        batches[batchId].pausedCodeIds[leaf] = isPaused;
        emit CodePaused(batchId, codeId, isPaused);
    }

    function setBatchExpireTime(uint256 batchId, uint256 expireTime) 
        external 
        batchExists(batchId) 
        onlySystemAdminOrBatchOwnerOrAdmin(batchId) 
    {
        batches[batchId].expireTime = expireTime;
        emit BatchExpireTimeSet(batchId, expireTime);
    }

    function addBatchAdmin(uint256 batchId, address admin) 
        external 
        batchExists(batchId) 
    {
        require(batches[batchId].issuer == msg.sender, "Only batch owner can add admin");
        _grantRole(_getBatchAdminRole(batchId), admin);
        emit BatchAdminAdded(batchId, admin);
    }

    function removeBatchAdmin(uint256 batchId, address admin) 
        external 
        batchExists(batchId) 
    {
        require(batches[batchId].issuer == msg.sender, "Only batch owner can remove admin");
        _revokeRole(_getBatchAdminRole(batchId), admin);
        emit BatchAdminRemoved(batchId, admin);
    }

    // System admin functions
    function pause() external onlyRole(SYSTEM_ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(SYSTEM_ADMIN_ROLE) {
        _unpause();
    }

    function addTrustedSigner(address signer) external onlyRole(SYSTEM_ADMIN_ROLE) {
        require(signer != address(0), "Invalid signer address");
        require(!trustedSigners[signer], "Signer already exists");
        trustedSigners[signer] = true;
        emit TrustedSignerAdded(signer);
    }

    function removeTrustedSigner(address signer) external onlyRole(SYSTEM_ADMIN_ROLE) {
        require(trustedSigners[signer], "Signer does not exist");
        trustedSigners[signer] = false;
        emit TrustedSignerRemoved(signer);
    }

    function setBatchFactory(address batchFactory) external onlyRole(SYSTEM_ADMIN_ROLE) {
        require(batchFactory != address(0), "Invalid batch factory address");
        _grantRole(BATCH_FACTORY_ROLE, batchFactory);
        emit BatchFactorySet(batchFactory);
    }

    function removeBatchFactory(address batchFactory) external onlyRole(SYSTEM_ADMIN_ROLE) {
        _revokeRole(BATCH_FACTORY_ROLE, batchFactory);
        emit BatchFactoryRemoved(batchFactory);
    }

    // View functions
    function getBatchInfo(uint256 batchId) external view batchExists(batchId) returns (BatchInfo memory) {
        Batch storage batch = batches[batchId];
        return BatchInfo({
            batchId: batch.batchId,
            issuer: batch.issuer,
            nftContract: batch.nftContract,
            merkleRoot: batch.merkleRoot,
            totalCodes: batch.totalCodes,
            claimedCodes: batch.claimedCodes,
            expireTime: batch.expireTime,
            isPaused: batch.isPaused,
            isNFT721: batch.isNFT721
        });
    }

    function isCodeClaimed(uint256 batchId, string memory codeId) 
        external 
        view 
        batchExists(batchId) 
        returns (bool) 
    {
        bytes32 leaf = keccak256(abi.encodePacked(codeId));
        return batches[batchId].claimedCodeIds[leaf];
    }

    function isCodePaused(uint256 batchId, string memory codeId) 
        external 
        view 
        batchExists(batchId) 
        returns (bool) 
    {
        bytes32 leaf = keccak256(abi.encodePacked(codeId));
        return batches[batchId].pausedCodeIds[leaf];
    }

    function getIssuerBatches(address issuer) external view returns (uint256[] memory) {
        return issuerBatches[issuer];
    }

    function getCurrentBatchId() external view returns (uint256) {
        return _nextBatchId - 1;
    }

    function isBatchAdmin(uint256 batchId, address account) external view returns (bool) {
        return hasRole(_getBatchAdminRole(batchId), account);
    }

    function isTrustedSigner(address signer) external view returns (bool) {
        return trustedSigners[signer];
    }

    function getWalletNonce(address wallet) external view returns (uint256) {
        return walletNonces[wallet];
    }

    function isBatchFactory(address account) external view returns (bool) {
        return hasRole(BATCH_FACTORY_ROLE, account);
    }
}
