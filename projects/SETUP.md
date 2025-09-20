# 🚀 Quick Setup Guide

This guide will help you get the MemeRoulette Lucky Box up and running quickly.

## 📋 Prerequisites

- Node.js v16+ installed
- A wallet with some test tokens
- Basic knowledge of blockchain development

## ⚡ Quick Start (5 minutes)

### 1. Install Dependencies

```bash
npm install
cd frontend && npm install && cd ..
```

### 2. Configure Environment

```bash
# Copy the example environment file
cp env.example .env

# Edit .env with your private key
nano .env
```

Add your private key to the `.env` file:
```env
PRIVATE_KEY=your_private_key_here
```

### 3. Deploy Contracts

```bash
# Compile contracts
npm run compile

# Deploy to testnet
npm run deploy:testnet

# Setup the game (fund contracts)
npx hardhat run scripts/setup.js --network testnet
```

### 4. Update Frontend

After deployment, copy the contract addresses from the terminal output and update:

**File: `frontend/src/main.ts`**
```typescript
const LUCKYBOX_ADDRESS = "0xYourDeployedLuckyBoxAddress";
const USDT_ADDRESS = "0xYourDeployedUSDTAddress";
```

### 5. Start Frontend

```bash
npm run frontend:dev
```

Open http://localhost:3000 in your browser!

## 🎮 How to Play

1. **Connect Wallet**: Click "Connect Wallet" and approve the connection
2. **Approve USDT**: Click "Approve 1 USDT" to allow the contract to spend your USDT
3. **Spin**: Click "🎰 Spin 1 USDT" to play
4. **Win**: Check your wallet for the random token you won!

## 🔧 Troubleshooting

### Common Issues

**"Connect wallet first" error**
- Make sure MetaMask is installed and unlocked
- Check that you're on the correct network (Monad Testnet)

**"Insufficient allowance" error**
- Click "Approve 1 USDT" before spinning
- Wait for the approval transaction to confirm

**"Pool not set" error**
- Run the setup script: `npx hardhat run scripts/setup.js --network testnet`
- Make sure contracts are properly deployed

**Frontend shows "0xYourLuckyBox"**
- Update the contract addresses in `frontend/src/main.ts`
- Restart the frontend development server

### Network Configuration

**Monad Testnet Details:**
- Chain ID: 41434
- RPC URL: https://rpc.testnet.monad.xyz
- Block Explorer: https://testnet.monad.xyz

Add to MetaMask:
1. Open MetaMask
2. Click network dropdown
3. Click "Add Network"
4. Enter the details above

## 📊 Understanding the Game

### Pool Structure
- **10 different tokens** in the pool
- **10 pieces** of each token available
- **Total pool size**: 100 pieces

### Economics
- **Spin cost**: 1 USDT
- **Team fee**: 5% (0.05 USDT)
- **Refill budget**: 95% (0.95 USDT)
- **Prize**: 1 piece of randomly selected token

### Auto-Refill
After each spin:
1. User wins 1 piece of a token
2. Contract sends 0.95 USDT to refiller
3. Refiller sends back 1 piece of the same token
4. Pool stays full (10 pieces per token)

## 🛠️ Development Commands

```bash
# Compile contracts
npm run compile

# Run tests
npm test

# Deploy to local network
npm run deploy:local

# Deploy to testnet
npm run deploy:testnet

# Start frontend dev server
npm run frontend:dev

# Build frontend
npm run frontend:build
```

## 📝 Next Steps

1. **Test the game**: Try spinning a few times
2. **Check transactions**: View on block explorer
3. **Customize**: Modify token list or amounts
4. **Deploy to mainnet**: When ready for production

## 🆘 Need Help?

- Check the main README.md for detailed documentation
- Review the smart contract code in `contracts/`
- Look at the deployment logs for contract addresses
- Create an issue on GitHub if you encounter problems

---

**Ready to spin? Let's go! 🎰**
