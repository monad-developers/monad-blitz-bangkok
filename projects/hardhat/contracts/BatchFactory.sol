// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "./BatchManager.sol";
import "./Once721TemplateV2.sol";
import "./Once1155TemplateV2.sol";

/**
 * @title BatchFactory
 * @dev Factory contract for creating batches and deploying NFT contracts using EIP-1167 minimal proxy
 */
contract BatchFactory is AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;
    
    bytes32 public constant SYSTEM_ADMIN_ROLE = keccak256("SYSTEM_ADMIN_ROLE");
    
    // Template contracts for cloning
    address public immutable once721Template;
    address public immutable once1155Template;
    
    // BatchManager contract
    BatchManager public immutable batchManager;
    
    // Configuration
    uint256 public tokensPerCode = 1; // System-wide ERC20 cost per code for batch creation
    uint256 public minCodesPerBatch = 10;
    
    // Payment token for batch creation fees
    address public paymentToken; // ERC20 token address for payment
    
    // NFT Type enum
    enum NFTType { ERC721, ERC1155_ART, ERC1155_STAMP }
    
    // Structs
    struct CreateBatchParams {
        NFTType nftType;
        string name;
        string symbol;
        bytes32 merkleRoot;
        uint256 totalCodes;
        uint256 expireTime;
        address existingNFTContract; // Optional: use existing NFT contract
        address royaltyRecipient;
        uint96 royaltyFeeNumerator; // In basis points (100 = 1%)
        string baseURI;
        uint256 deadline; // For backend signature
        bytes backendSig; // Backend signature
    }
    
    // State variables
    mapping(address => address[]) public issuerNFTContracts;
    mapping(address => mapping(NFTType => address[])) public issuerNFTContractsByType;
    mapping(address => uint256) public issuerNonce; // Track nonce for each issuer
    
    // TrustedSigner variables
    mapping(address => bool) public trustedSigners;
    mapping(bytes32 => bool) public usedSignatures;
    
    // Events
    event NFTContractDeployed(
        address indexed issuer,
        address indexed nftContract,
        NFTType indexed nftType,
        string name,
        string symbol
    );
    
    event BatchCreatedViaFactory(
        uint256 indexed batchId,
        address indexed issuer,
        address indexed nftContract,
        NFTType nftType,
        bytes32 merkleRoot,
        uint256 tokensPerCode,
        uint256 totalCodes
    );
    
    event PaymentCollected(
        address indexed issuer,
        uint256 indexed batchId,
        uint256 totalPayment
    );
    
    event SignatureVerified(address indexed issuer, address indexed signer);

    constructor(
        address _batchManager,
        address _once721Template,
        address _once1155Template,
        address _paymentToken
    ) {
        require(_batchManager != address(0), "Invalid BatchManager address");
        require(_once721Template != address(0), "Invalid ERC721 template address");
        require(_once1155Template != address(0), "Invalid ERC1155 template address");
        require(_paymentToken != address(0), "Invalid payment token address");
        
        batchManager = BatchManager(_batchManager);
        once721Template = _once721Template;
        once1155Template = _once1155Template;
        paymentToken = _paymentToken;
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(SYSTEM_ADMIN_ROLE, msg.sender);
    }

    // Configuration functions
    function setTokensPerCode(uint256 _tokensPerCode) external onlyRole(SYSTEM_ADMIN_ROLE) {
        tokensPerCode = _tokensPerCode; // System Admin sets universal rate (0 = free)
    }

    function setMinCodesPerBatch(uint256 _minCodes) external onlyRole(SYSTEM_ADMIN_ROLE) {
        require(_minCodes > 0, "Min codes must be positive");
        minCodesPerBatch = _minCodes;
    }

    function setPaymentToken(address _paymentToken) external onlyRole(SYSTEM_ADMIN_ROLE) {
        require(_paymentToken != address(0), "Invalid payment token address");
        paymentToken = _paymentToken;
    }

    // Main function to create batch
    // TrustSigner flow: verify backend signature for batch creation
    function createBatch(CreateBatchParams memory params) external nonReentrant returns (uint256 batchId, address nftContract) {
        // Validate parameters
        require(params.merkleRoot != bytes32(0), "Invalid merkle root");
        require(params.totalCodes >= minCodesPerBatch, "Total codes below minimum");

        address issuer = msg.sender;
        uint256 nonce = issuerNonce[issuer];

        // TrustSigner: verify backend signature for batch creation
        address backendSigner = _verifyBackendSignature(
            issuer,
            params.nftType,
            params.name,
            params.symbol,
            params.merkleRoot,
            params.totalCodes,
            params.expireTime,
            params.royaltyRecipient,
            params.royaltyFeeNumerator,
            params.baseURI,
            params.deadline,
            nonce,
            params.backendSig
        );

        emit SignatureVerified(issuer, backendSigner);

        // Calculate and collect payment using system-defined rate
        uint256 totalPayment = tokensPerCode * params.totalCodes;
        if (totalPayment > 0) {
            IERC20(paymentToken).safeTransferFrom(issuer, address(this), totalPayment);
        }

        // Determine NFT contract to use
        if (params.existingNFTContract != address(0)) {
            // Use existing NFT contract
            nftContract = params.existingNFTContract;
            require(_isValidNFTContract(nftContract, params.nftType), "Invalid existing NFT contract");
        } else {
            // Deploy new NFT contract - validate royalty parameters only when creating new contract
            require(params.royaltyRecipient != address(0), "Invalid royalty recipient");
            require(params.royaltyFeeNumerator <= 10000, "Royalty fee too high"); // Max 100%
            
            nftContract = _deployNFTContract(
                issuer,
                params.nftType,
                params.name,
                params.symbol,
                params.royaltyRecipient,
                params.royaltyFeeNumerator,
                params.baseURI
            );
        }

        // Create batch in BatchManager (payment handled at factory level)
        batchId = batchManager.createBatch(
            issuer,
            nftContract,
            params.merkleRoot,
            params.totalCodes,
            params.expireTime,
            params.nftType == NFTType.ERC721
        );

        issuerNonce[issuer]++;

        emit BatchCreatedViaFactory(
            batchId,
            issuer,
            nftContract,
            params.nftType,
            params.merkleRoot,
            tokensPerCode, // Payment amount per code (system rate)
            params.totalCodes
        );

        if (totalPayment > 0) {
            emit PaymentCollected(issuer, batchId, totalPayment);
        }

        return (batchId, nftContract);
    }

    // Events for TrustedSigner
    event TrustedSignerAdded(address indexed signer);
    event TrustedSignerRemoved(address indexed signer);
    
    // Internal function for backend signature verification
    function _verifyBackendSignature(
        address issuer,
        NFTType nftType,
        string memory name,
        string memory symbol,
        bytes32 merkleRoot,
        uint256 totalCodes,
        uint256 expireTime,
        address royaltyRecipient,
        uint96 royaltyFeeNumerator,
        string memory baseURI,
        uint256 deadline,
        uint256 nonce,
        bytes memory signature
    ) internal returns (address signer) {
        require(block.timestamp <= deadline, "Signature expired");
        
        // Create the message hash according to the specified format
        bytes32 messageHash = keccak256(abi.encodePacked(
            issuer,
            nftType,
            name,
            symbol,
            merkleRoot,
            totalCodes,
            expireTime,
            royaltyRecipient,
            royaltyFeeNumerator,
            baseURI,
            deadline,
            nonce
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

    function isTrustedSigner(address signer) public view returns (bool) {
        return trustedSigners[signer];
    }



    // Deploy new NFT contract using EIP-1167 minimal proxy
    function _deployNFTContract(
        address issuer,
        NFTType nftType,
        string memory name,
        string memory symbol,
        address royaltyRecipient,
        uint96 royaltyFeeNumerator,
        string memory baseURI
    ) internal returns (address) {
        address implementation;
        address clone;
        
        // Use issuer nonce instead of timestamp for deterministic salt
        uint256 currentNonce = issuerNonce[issuer];
        bytes32 salt = keccak256(abi.encodePacked(issuer, name, symbol, currentNonce));
        
        if (nftType == NFTType.ERC721) {
            implementation = once721Template;
            // Use CREATE2 for deterministic address
            clone = Clones.cloneDeterministic(implementation, salt);
            
            // Initialize the cloned contract
            Once721TemplateV2(clone).initialize(
                name,
                symbol,
                issuer, // owner
                address(batchManager), // minter
                royaltyRecipient,
                royaltyFeeNumerator
            );
            
            // Set base URI if provided
            if (bytes(baseURI).length > 0) {
                Once721TemplateV2(clone).setBaseURI(baseURI);
            }
            
        } else {
            // ERC1155 for both ART and STAMP types
            implementation = once1155Template;
            // Use CREATE2 for deterministic address
            clone = Clones.cloneDeterministic(implementation, salt);
            
            // Initialize the cloned contract
            Once1155TemplateV2(clone).initialize(
                name,
                symbol,
                issuer, // owner
                address(batchManager), // minter
                royaltyRecipient,
                royaltyFeeNumerator
            );
            
            // Set base URI if provided
            if (bytes(baseURI).length > 0) {
                Once1155TemplateV2(clone).setURI(baseURI);
            }
        }
        
        // Track the contract
        issuerNFTContracts[issuer].push(clone);
        issuerNFTContractsByType[issuer][nftType].push(clone);
        
        emit NFTContractDeployed(issuer, clone, nftType, name, symbol);
        
        return clone;
    }

    // Validate existing NFT contract
    function _isValidNFTContract(address nftContract, NFTType nftType) internal view returns (bool) {
        if (nftType == NFTType.ERC721) {
            // Check if it's an ERC721 contract and has MINTER_ROLE for batchManager
            try Once721TemplateV2(nftContract).hasRole(
                Once721TemplateV2(nftContract).MINTER_ROLE(),
                address(batchManager)
            ) returns (bool hasMinterRole) {
                return hasMinterRole;
            } catch {
                return false;
            }
        } else {
            // Check if it's an ERC1155 contract and has MINTER_ROLE for batchManager
            try Once1155TemplateV2(nftContract).hasRole(
                Once1155TemplateV2(nftContract).MINTER_ROLE(),
                address(batchManager)
            ) returns (bool hasMinterRole) {
                return hasMinterRole;
            } catch {
                return false;
            }
        }
    }

    // View functions
    function calculateBatchCost(uint256 totalCodes) external view returns (uint256) {
        return tokensPerCode * totalCodes;
    }

    function getIssuerNFTContracts(address issuer) external view returns (address[] memory) {
        return issuerNFTContracts[issuer];
    }

    function getIssuerNFTContractsByType(address issuer, NFTType nftType) 
        external 
        view 
        returns (address[] memory) 
    {
        return issuerNFTContractsByType[issuer][nftType];
    }

    // Get current nonce for an issuer (NFT deployment)
    function getIssuerNonce(address issuer) external view returns (uint256) {
        return issuerNonce[issuer];
    }

    // Predict Next NFT contract address for an issuer based on current nonce
    function predictNextAddress(
        address issuer,
        NFTType nftType,
        string memory name,
        string memory symbol
    ) external view returns (address) {
        address implementation = nftType == NFTType.ERC721 ? once721Template : once1155Template;
        uint256 nonce = issuerNonce[issuer];
        bytes32 salt = keccak256(abi.encodePacked(issuer, name, symbol, nonce));
        return Clones.predictDeterministicAddress(implementation, salt, address(this));
    }

    // Payment management functions
    function withdrawPayments(address to, uint256 amount) external onlyRole(SYSTEM_ADMIN_ROLE) {
        require(to != address(0), "Invalid recipient address");
        IERC20(paymentToken).safeTransfer(to, amount);
    }

    function getPaymentBalance() external view returns (uint256) {
        return IERC20(paymentToken).balanceOf(address(this));
    }
}
