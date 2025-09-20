# Pop Komodo 🦎

A massively multiplayer on-chain clicking game showcasing the high-throughput capabilities of the Monad blockchain.

## Overview

Pop Komodo is a simple yet engaging blockchain game where users connect their wallets, choose a team (Ethereum, Bitcoin, or Monad), and click a Komodo dragon to add points to their team's score. Each click is a real blockchain transaction, demonstrating Monad's superior speed and low transaction costs.

## Features

- 🦎 **Interactive Komodo Clicking**: Click the Komodo dragon to earn points for your team
- 🔗 **Wallet Integration**: Connect with standard EVM-compatible wallets
- 🏆 **Team Competition**: Choose between Ethereum, Bitcoin, or Monad teams
- 📊 **Real-time Leaderboard**: Watch team scores update live as transactions confirm
- ⚡ **High Performance**: Built on Monad testnet for fast, low-cost transactions

## How to Play

1. **Visit the Site**: Navigate to the Pop Komodo web app
2. **Connect Wallet**: Connect your crypto wallet (MetaMask, etc.)
3. **Choose Team**: Select your team - Ethereum, Bitcoin, or Monad (permanent choice)
4. **Pop the Komodo**: Click the Komodo dragon to increment your team's score
5. **View Leaderboard**: Watch real-time scores for all teams

## Tech Stack

### Smart Contract

- **Development Environment**: Hardhat 👷
- **Language**: Solidity
- **Blockchain**: Monad Testnet

### Frontend

- **Framework**: Vite + React
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Wallet Connection**: RainbowKit + wagmi
- **Blockchain Interaction**: Viem

## Development Setup

### Prerequisites

- Node.js (v18+)
- npm or yarn
- A wallet with Monad testnet tokens

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd pop-komodo-monad
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp .env.example .env
# Add your private keys and RPC URLs
```

### Smart Contract Development

1. Compile contracts:

```bash
npx hardhat compile
```

2. Run tests:

```bash
npx hardhat test
```

3. Deploy to Monad testnet:

```bash
npx hardhat run scripts/deploy.ts --network monad-testnet
```

### Frontend Development

1. Start the development server:

```bash
npm run dev
```

2. Build for production:

```bash
npm run build
```

## Smart Contract

The PopKomodo contract includes:

- Team selection functionality (one-time choice per wallet)
- Pop mechanic (increment team scores)
- Score tracking for all three teams
- Events for real-time updates

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Hackathon

This project is built for the Monad Blitz hackathon, demonstrating:

- Monad's high transaction throughput
- Low transaction costs
- Superior user experience for on-chain gaming

---

**Pop the Komodo and help your team win! 🏆**
