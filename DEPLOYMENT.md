# Monad Code Arena - Deployment Guide

## Prerequisites

1. **Node.js 18+** installed
2. **npm** package manager
3. **Wallet** with Monad testnet tokens
4. **Environment variables** configured

## Setup Instructions

### 1. Clone and Install

```bash
# Make setup script executable
chmod +x setup.sh

# Run setup
./setup.sh
```

### 2. Configure Environment

Fill in the following files with your values:

#### `.env` (Root level)
```env
# Blockchain Configuration
MONAD_TESTNET_RPC_URL=https://testnet-rpc.monad.xyz
PRIVATE_KEY=your_deployer_private_key
ORACLE_PRIVATE_KEY=your_oracle_private_key

# Contract Addresses (filled after deployment)
GAME_TOKEN_ADDRESS=
ARENA_CONTRACT_ADDRESS=
BADGES_CONTRACT_ADDRESS=

# Database
DATABASE_URL=file:./monad_arena.db

# API Configuration
BACKEND_URL=http://localhost:3001
FRONTEND_URL=http://localhost:3000
```

#### `frontend/.env.local`
```env
NEXT_PUBLIC_MONAD_TESTNET_RPC_URL=https://testnet-rpc.monad.xyz
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
```

### 3. Local Development

```bash
# Start all services
chmod +x dev.sh
./dev.sh
```

This will start:
- Local Hardhat blockchain (port 8545)
- Backend API server (port 3001)
- Frontend Next.js app (port 3000)

### 4. Monad Testnet Deployment

```bash
# Deploy contracts to Monad testnet
cd contracts
npm run deploy:testnet

# Update .env with deployed contract addresses
# Start backend and frontend with testnet configuration
```

## Project Structure

```
MonadSpeedCode/
├── contracts/          # Solidity smart contracts
│   ├── src/
│   │   ├── GameToken.sol      # ERC-20 token
│   │   ├── Arena.sol          # Match management
│   │   └── Badges.sol         # ERC-1155 achievements
│   ├── test/          # Contract tests
│   └── scripts/       # Deployment scripts
├── frontend/          # Next.js web application
│   ├── src/app/       # App router pages
│   ├── src/components/# React components
│   └── src/lib/       # Utilities and configs
├── backend/           # Node.js API server
│   ├── src/services/  # Core business logic
│   ├── src/routes/    # API endpoints
│   └── src/database/  # Data layer
├── shared/            # Shared TypeScript types
└── docs/              # Documentation
```

## Key Features

### Smart Contracts
- **GameToken**: ERC-20 token for staking and rewards
- **Arena**: Match lifecycle and escrow management
- **Badges**: ERC-1155 NFT achievements

### Backend Services
- **Oracle**: Code execution and match resolution
- **Judge**: Sandboxed code testing
- **Challenge**: Problem management
- **Database**: Match and player data

### Frontend Features
- **Lobby**: Browse and join matches
- **Match**: Real-time coding interface
- **Profile**: Player stats and badges
- **Leaderboard**: ELO rankings

## API Endpoints

### Matches
- `GET /api/matches` - List matches
- `POST /api/matches/create` - Create match
- `POST /api/matches/:id/join` - Join match
- `POST /api/matches/:id/submit` - Submit solution

### Players
- `GET /api/players/:address` - Player profile
- `PUT /api/players/:address` - Update profile

### Challenges
- `GET /api/challenges` - List challenges
- `GET /api/challenges/:id` - Challenge details

## Testing

```bash
# Test smart contracts
cd contracts && npm test

# Test backend services
cd backend && npm test

# Type check frontend
cd frontend && npm run type-check
```

## Troubleshooting

### Common Issues

1. **Port conflicts**: Check ports 3000, 3001, 8545
2. **Environment variables**: Ensure all required vars are set
3. **Node version**: Use Node.js 18+
4. **Dependencies**: Run `npm run install:all`

### Reset Environment

```bash
# Clean and reinstall
npm run clean
./setup.sh
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details.