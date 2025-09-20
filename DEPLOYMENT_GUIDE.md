# 🚀 Monad Code Arena - Deployment Guide

## Prerequisites

1. **Node.js** (v18+)
2. **npm** or **yarn**
3. **Git**
4. **Monad Testnet Tokens** - Get from [Monad Faucet](https://faucet.monad.xyz/)
5. **Private Key** with testnet funds

## Quick Start

### 1. Install Dependencies
```bash
./setup.sh
```

### 2. Configure Environment Variables

Fill in your `.env` file with real values:

```bash
# Blockchain Configuration
PRIVATE_KEY=your_private_key_here
MONAD_TESTNET_RPC_URL=https://testnet-rpc.monad.xyz
MONAD_TESTNET_EXPLORER_URL=https://testnet-explorer.monad.xyz

# Backend Configuration  
JWT_SECRET=your_jwt_secret_here
ORACLE_PRIVATE_KEY=your_oracle_private_key_here
DATABASE_URL=./db/arena.db
PORT=3001

# WalletConnect (get from https://cloud.reown.com)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here
```

And `frontend/.env.local`:
```bash
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
```

### 3. Deploy to Monad Testnet

```bash
# Deploy smart contracts
cd contracts
npm run deploy:testnet

# This will output contract addresses - save these!
```

### 4. Update Contract Addresses

After deployment, update the contract addresses in:
- `backend/src/config/contracts.ts`
- `frontend/src/config/contracts.ts`

### 5. Start Services

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend  
npm run dev
```

### 6. Access the Platform

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:3001

## Environment Details

### Monad Testnet Configuration
- **Chain ID:** 41454
- **RPC URL:** https://testnet-rpc.monad.xyz  
- **Explorer:** https://testnet-explorer.monad.xyz
- **Faucet:** https://faucet.monad.xyz

### Getting Testnet Tokens

1. Visit [Monad Faucet](https://faucet.monad.xyz/)
2. Connect your wallet or enter your address
3. Request testnet MON tokens
4. Wait for confirmation

### WalletConnect Setup

1. Go to [Reown Cloud](https://cloud.reown.com) (formerly WalletConnect)
2. Create a new project
3. Copy your Project ID
4. Add it to your environment files

## Contract Deployment

The deployment script will deploy in this order:
1. **GameToken** - $GAME ERC-20 token
2. **Badges** - ERC-1155 achievement NFTs  
3. **Arena** - Main game logic contract

After deployment, you'll see output like:
```
🎮 Deploying Monad Code Arena contracts...

GameToken deployed to: 0x1234...
Badges deployed to: 0x5678...
Arena deployed to: 0x9abc...

✅ All contracts deployed successfully!
```

**Important:** Save these addresses and update your config files!

## Production Deployment

### Smart Contracts
1. Deploy contracts to Monad testnet
2. Verify contracts on Monad Explorer (when available)
3. Update frontend/backend with contract addresses

### Backend (Oracle Service)
- Deploy to cloud provider (Vercel, Railway, Heroku)
- Use production database (PostgreSQL recommended)
- Set up proper environment variables
- Configure CORS for your frontend domain

### Frontend
- Deploy to Vercel, Netlify, or similar
- Update environment variables for production
- Configure proper domain and SSL

## Troubleshooting

### Common Issues

**"Insufficient funds for gas"**
- Get more testnet tokens from the faucet
- Check your wallet has MON tokens

**"Network connection failed"**
- Verify Monad testnet RPC URL is correct
- Check if testnet is operational

**"Contract not deployed"**  
- Run deployment script first
- Update contract addresses in config files

**"WalletConnect not working"**
- Verify Project ID is correct
- Check WalletConnect configuration

### Debug Commands

```bash
# Check contract deployment
cd contracts && npx hardhat verify --network monad_testnet <contract_address>

# Test backend connection
curl http://localhost:3001/api/health

# Check frontend build
cd frontend && npm run build
```

## Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │ Smart Contracts │
│   (Next.js)     │◄──►│   (Node.js)     │◄──►│   (Solidity)    │
│                 │    │                 │    │                 │
│ • Match UI      │    │ • Oracle        │    │ • GameToken     │
│ • Wallet        │    │ • Code Judge    │    │ • Arena         │
│ • Leaderboard   │    │ • Database      │    │ • Badges        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Support

For issues or questions:
1. Check this deployment guide
2. Review error logs in browser/terminal
3. Verify all environment variables are set
4. Ensure you have testnet tokens

Happy coding! 🎮