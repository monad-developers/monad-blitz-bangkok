# 🎰 MemeRoulette Lucky Box

A decentralized gambling game built on Monad blockchain where users can spin 1 USDT to win random meme tokens from a pool of 10 different tokens.

## 🚀 Features

- **Simple Gameplay**: Pay 1 USDT, spin the wheel, win random tokens
- **Auto-Refill Mechanism**: Pool automatically refills after each spin
- **Fair Distribution**: 5% fee to team, 95% used for refilling the pool
- **10 Token Pool**: Each token has 10 pieces available
- **Modern Frontend**: Beautiful TypeScript/ethers.js interface
- **Production Ready**: Built with OpenZeppelin contracts and best practices

## 📁 Project Structure

```
MemeRoulleteLuckyBox/
├── contracts/                 # Solidity smart contracts
│   ├── MemeRouletteLuckyBox.sol  # Main game contract
│   ├── MockRefiller.sol          # Auto-refill mechanism
│   └── MockUSDT.sol              # Mock USDT for testing
├── scripts/                   # Deployment and setup scripts
│   ├── deploy.js             # Deploy all contracts
│   └── setup.js              # Configure and fund contracts
├── test/                     # Test files (to be added)
├── frontend/                 # TypeScript frontend
│   ├── src/
│   │   ├── main.ts          # Main application logic
│   │   └── config.ts        # Configuration
│   ├── index.html           # Frontend HTML
│   └── package.json         # Frontend dependencies
├── deployments/             # Deployment artifacts
├── hardhat.config.js        # Hardhat configuration
├── package.json             # Project dependencies
└── README.md               # This file
```

## 🛠️ Installation & Setup

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Git

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone <your-repo-url>
cd MemeRoulleteLuckyBox

# Install dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### 2. Environment Configuration

```bash
# Copy environment template
cp env.example .env

# Edit .env with your configuration
nano .env
```

Required environment variables:
```env
# Network Configuration
TESTNET_RPC_URL=https://rpc.testnet.monad.xyz
TESTNET_CHAIN_ID=41434
PRIVATE_KEY=your_private_key_here

# Contract Addresses (filled after deployment)
LUCKYBOX_ADDRESS=
MOCK_REFILLER_ADDRESS=
USDT_ADDRESS=
TEAM_WALLET_ADDRESS=
```

### 3. Compile Contracts

```bash
npm run compile
```

## 🚀 Deployment

### Local Development

```bash
# Start local Hardhat node
npx hardhat node

# In another terminal, deploy to local network
npm run deploy:local

# Setup the contracts (fund and configure)
npx hardhat run scripts/setup.js --network localhost
```

### Testnet Deployment

```bash
# Deploy to testnet
npm run deploy:testnet

# Setup contracts
npx hardhat run scripts/setup.js --network testnet
```

### Mainnet Deployment

```bash
# Deploy to mainnet
npm run deploy:mainnet

# Setup contracts
npx hardhat run scripts/setup.js --network mainnet
```

## 🎮 Frontend Usage

### Development Mode

```bash
# Start frontend development server
npm run frontend:dev
```

### Production Build

```bash
# Build frontend
npm run frontend:build

# Serve built files
npm run frontend:serve
```

### Update Contract Addresses

After deployment, update the contract addresses in:
- `frontend/src/main.ts` (lines 4-5)
- `frontend/src/config.ts` (lines 4-5)

## 🎯 How It Works

### Game Mechanics

1. **Pool Setup**: 10 different tokens, each with 10 pieces
2. **User Action**: Pay 1 USDT to spin
3. **Fee Distribution**: 5% to team, 95% for refilling
4. **Random Selection**: Uniform random selection of one token
5. **Prize Distribution**: User receives 1 piece of selected token
6. **Auto-Refill**: Refiller receives 0.95 USDT and sends back 1 piece of the won token

### Smart Contract Architecture

- **MemeRouletteLuckyBox**: Main game contract with spin logic
- **MockRefiller**: Handles auto-refill mechanism
- **MockUSDT**: ERC20 token for testing (6 decimals like real USDT)

### Security Features

- **ReentrancyGuard**: Prevents reentrancy attacks
- **Ownable**: Admin functions protected
- **SafeERC20**: Safe token transfers
- **Input Validation**: Comprehensive parameter validation

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npx hardhat coverage
```

## 📊 Gas Optimization

The contracts are optimized for gas efficiency:
- Minimal storage operations
- Efficient random number generation
- Batch operations where possible
- Gas report available with `npm run test`

## 🔧 Configuration

### Pool Configuration

The pool can be configured with different tokens and amounts:

```javascript
// Example: Configure pool with 10 tokens
const tokens = [token1, token2, ..., token10];
const slotAmounts = [amount1, amount2, ..., amount10]; // Amount per piece
await luckyBox.configurePool(tokens, slotAmounts);
```

### Fee Structure

- **Team Fee**: 5% (500 basis points)
- **Refill Budget**: 95% (9500 basis points)
- **Spin Price**: 1 USDT (1,000,000 units with 6 decimals)

## 🚨 Important Notes

### Randomness

⚠️ **For Demo Only**: The current implementation uses `block.prevrandao` for randomness, which is suitable for hackathon demos but **NOT for production**. For production use, implement:

- Chainlink VRF (Verifiable Random Function)
- Commit-reveal scheme
- Oracle-based randomness

### Security Considerations

- Always audit smart contracts before mainnet deployment
- Test thoroughly on testnets
- Consider upgradeable contracts for future improvements
- Implement proper access controls

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For questions or issues:
- Create an issue on GitHub
- Check the documentation
- Review the smart contract code

## 🎉 Acknowledgments

- Built with [Hardhat](https://hardhat.org/)
- Uses [OpenZeppelin](https://openzeppelin.com/) contracts
- Frontend built with [Vite](https://vitejs.dev/) and [ethers.js](https://docs.ethers.org/)
- Deployed on [Monad](https://monad.xyz/) blockchain

---

**Happy Spinning! 🎰🚀**
