# OnceQR - Smart Contract Infrastructure

A comprehensive smart contract system for QR code-based NFT distribution with batch management, Merkle tree validation, and gas-efficient deployment using EIP-1167 minimal proxies.

## 🌟 Overview

OnceQR is a decentralized platform that enables businesses and creators to distribute NFTs through QR codes. The system supports batch creation, validation through Merkle proofs, and provides robust access controls for managing NFT campaigns.

### Key Features

- **QR Code-Based NFT Distribution**: Mint NFTs by scanning QR codes
- **Batch Management**: Organize NFT distributions into batches with Merkle tree validation
- **Gas Efficient**: Uses EIP-1167 minimal proxies for ~90% gas savings on NFT contract deployments
- **Multi-Token Support**: ERC721 and ERC1155 (Art & Stamp variants)
- **Comprehensive Access Controls**: Multi-level pause and ban system
- **Royalty Support**: Built-in ERC2981 royalty standard implementation

## 📁 Project Structure

```
contracts/
├── BatchManager.sol          # Core batch and claiming logic
├── BatchFactory.sol          # Factory for creating batches and NFT contracts
├── Once721TemplateV2.sol     # ERC721 template for minimal proxy cloning
├── Once1155TemplateV2.sol    # ERC1155 template for minimal proxy cloning
└── OnceToken.sol            # ERC20 token for batch creation fees

scripts/
├── full_deploy.js           # Complete deployment script
├── continue_deploy.js       # Continue partial deployment
└── verify_contracts.js     # Contract verification

test/
├── BatchManager.test.js     # Core functionality tests
├── BatchFactory.test.js     # Factory contract tests
├── Once721TemplateV2.test.js
├── Once1155TemplateV2.test.js
└── Legacies/               # Legacy V1 contract tests

verify-args/                # Contract verification arguments
```

## 🏗️ Architecture

### Core Contracts

#### BatchManager
The heart of the system that manages:
- Batch creation and lifecycle
- QR code claiming with Merkle proof validation
- Access controls (System Admin, Batch Owner, Batch Admin)
- Pause/ban mechanisms for security

#### BatchFactory
Factory contract responsible for:
- Creating new batches
- Deploying NFT contracts using EIP-1167 minimal proxies
- Managing template contracts and configurations
- Gas-efficient contract creation with CREATE2

#### Template Contracts
- **Once721TemplateV2**: ERC721 implementation with initializer pattern
- **Once1155TemplateV2**: ERC1155 implementation with initializer pattern
- Support pause/unpause, royalties (ERC2981), and role-based access

## 🚀 Getting Started

### Prerequisites

- Node.js >= 16.0.0
- npm or yarn
- Hardhat

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd hardhat

# Install dependencies
npm install

# Compile contracts
npx hardhat compile
```

### Environment Setup

Create a `.env` file:

```env
PRIVATE_KEY=your_private_key_here
ALCHEMY_API_KEY=your_alchemy_api_key
ETHERSCAN_API_KEY=your_etherscan_api_key
```

### Network Configuration

The project is configured for Monad Testnet (Chain ID: 10143). Update `hardhat.config.js` for other networks.

## 📋 Deployment

### Full Deployment

Deploy all contracts in the correct order:

```bash
npx hardhat run scripts/full_deploy.js --network monadTestnet
```

This will deploy:
1. OnceToken (ERC20 for fees)
2. BatchManager
3. Template contracts (Once721TemplateV2, Once1155TemplateV2)
4. BatchFactory

### Contract Verification

```bash
npx hardhat run scripts/verify_contracts.js --network monadTestnet
```

## 🎯 Usage Examples

### For Issuers (Creating Campaigns)

```javascript
// 1. Create batch parameters
const params = {
    nftType: 0, // ERC721
    name: "My NFT Collection",
    symbol: "MNC",
    merkleRoot: "0x...", // Generated from QR codes
    totalCodes: 1000,
    expireTime: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60), // 30 days
    existingNFTContract: "0x0000000000000000000000000000000000000000", // Create new
    royaltyRecipient: "0x...", // Royalty recipient address
    royaltyFeeNumerator: 500, // 5% royalty
    baseURI: "https://api.example.com/metadata/"
};

// 2. Create batch through BatchFactory
const tx = await batchFactory.createBatch(params);
const receipt = await tx.wait();

// 3. Get batch ID and NFT contract address from events
const event = receipt.events.find(e => e.event === 'BatchCreated');
const { batchId, nftContract } = event.args;
```

### For End Users (Claiming NFTs)

```javascript
// 1. Scan QR code to get codeId
const codeId = "ABC123DEF456"; // From QR code

// 2. Get Merkle proof from backend
const proof = await getProofFromBackend(codeId, batchId);

// 3. Claim NFT
const tx = await batchManager.claimCode(batchId, codeId, proof);
await tx.wait();

// NFT is now minted to user's wallet
```

### Administrative Functions

```javascript
// Pause a batch (Batch Admin or System Admin)
await batchManager.pauseBatch(batchId, true);

// Ban a user from a batch
await batchManager.pauseWalletForBatch(batchId, userAddress, true);

// Set new expiration time
await batchManager.setBatchExpireTime(batchId, newExpireTime);
```

## 🔒 Security Features

### Access Control Levels

1. **System Admin**: Full system control, can pause everything
2. **Batch Owner**: Controls their own batches
3. **Batch Admin**: Delegated admin rights for specific batches

### Pause Mechanisms

- **Global Pause**: Stop entire system (System Admin only)
- **Issuer Pause**: Disable all batches from specific issuer
- **Batch Pause**: Disable specific batch
- **Wallet Pause**: Ban specific wallet (global or per-batch)
- **Code Pause**: Disable specific QR codes

### Validation

- Merkle proof validation for QR codes
- Double-claiming prevention
- Expiration time enforcement
- Reentrancy protection

## ⚡ Gas Optimization

The system uses EIP-1167 minimal proxies for significant gas savings:

| Operation | Traditional Deployment | Minimal Proxy |
|-----------|----------------------|---------------|
| Template Deploy | N/A | ~2M gas (one-time) |
| NFT Contract | ~2M gas each | ~200K gas each |
| **Savings** | - | **~90% gas reduction** |

## 🧪 Testing

Run the complete test suite:

```bash
# Run all tests
npm test

# Run specific test file
npx hardhat test test/BatchManager.test.js

# Run tests with coverage
npx hardhat coverage
```

Test coverage includes:
- ✅ Batch creation and management
- ✅ QR code claiming with Merkle proofs
- ✅ Access control and pause mechanisms
- ✅ NFT minting (ERC721 & ERC1155)
- ✅ Gas optimization validation
- ✅ Edge cases and security scenarios

## 📊 Contract Addresses (Monad Testnet)

```json
{
  "network": "monadTestnet (Chain ID: 10143)",
  "contracts": {
    "onceToken": "0x53Af2E544dc9b40c5f3a0D43A667EFFf943f2535",
    "batchManager": "0x62C3ae5cF6F89FA1D2BB41b6a28cE2F15deF087D",
    "once721Template": "0xA0b5571e8bfe8C03942e8bb2A50A41F7D8c9C850",
    "once1155Template": "0xBbabd9568326cD5AF963F4682Ea6c9F1467EE581",
    "batchFactory": "0x8B3247b9Aa9D7fd3c796F2d518F1C228A820CCb0"
  }
}
```

## 🛠️ Development Scripts

```bash
# Compile contracts
npm run build

# Deploy contracts
npm run deploy

# Publish to thirdweb
npm run publish

# Debug Merkle tree structure
node debug_tree_structure.js

# Debug Merkle proofs
node debug_merkle.js
```

## 📈 Roadmap

- [ ] **Multi-Chain Support**: Expand beyond Monad to other EVM chains
- [ ] **Batch Operations**: Bulk claiming and administrative functions
- [ ] **Advanced Analytics**: On-chain metrics and reporting
- [ ] **Mobile SDK**: Native mobile integration
- [ ] **Upgradeable Contracts**: Implement proxy upgrade patterns
- [ ] **Layer 2 Integration**: Optimize for L2 scaling solutions

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For technical support or questions:
- Create an issue in this repository
- Check existing documentation in `/contracts/README.md`
- Review test files for usage examples

## ⚠️ Disclaimer

This smart contract system is provided as-is. Please conduct thorough testing and auditing before using in production environments. The developers are not responsible for any loss of funds or other damages.
