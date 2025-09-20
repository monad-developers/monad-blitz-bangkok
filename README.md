# 🔍 Who Is This

**A decentralized reporting and voting platform built on Monad Testnet**

Report suspicious activities and vote on community submissions to earn WITH tokens. Built with transparency and community governance in mind.

## 🚀 Features

- 📝 **Create Reports**: Submit reports about suspicious activities
- 🗳️ **Community Voting**: Vote on reports as "Good" or "Bad"
- 🪙 **Token Rewards**: Earn WITH tokens for reporting and voting
- 🏆 **Claim System**: Reporters and voters can claim rewards when reports reach minimum vote threshold
- 👥 **Transparency**: View all voters and their addresses for each report
- 🔒 **Smart Contract Security**: Built with robust Solidity contracts

## 🛠️ Tech Stack

⚙️ Built using NextJS, RainbowKit, Hardhat, Wagmi, Viem, and Typescript on Monad Testnet.

- ✅ **Real-time Updates**: UI updates without page reloads after transactions
- 🪝 **Custom Hooks**: React hooks for seamless smart contract interactions
- 🧱 **Web3 Components**: Pre-built components for blockchain interactions
- 🔐 **Wallet Integration**: Connect with multiple wallet providers

## Requirements

Before you begin, you need to install the following tools:

- [Node (>= v20.18.3)](https://nodejs.org/en/download/)
- Yarn ([v1](https://classic.yarnpkg.com/en/docs/install/) or [v2+](https://yarnpkg.com/getting-started/install))
- [Git](https://git-scm.com/downloads)

## 🚀 Getting Started

To set up and run the Who Is This platform locally:

### Prerequisites

Ensure you have the Monad Testnet configured in your wallet:
- **Network Name**: Monad Testnet
- **RPC URL**: https://testnet-rpc.monad.xyz
- **Chain ID**: 10143
- **Currency Symbol**: MON

### Installation

1. Clone and install dependencies:

```bash
git clone <repository-url>
cd who-is-this
yarn install
```

2. Start the development server:

```bash
yarn start
```

3. Visit the app at `http://localhost:3000`

4. Connect your wallet and switch to Monad Testnet

### Smart Contracts

The platform uses deployed smart contracts on Monad Testnet:

- **WhoIsThis Contract**: `0xA0EB6dfEc8b60c5CC68D599c6DFDD8BbD797cF35`
- **WITH Token Contract**: `0xe3599c93c092817f79Ec1e090998684B86343794`

### Usage

1. **Create a Report**: Submit a title describing suspicious activity
2. **Vote on Reports**: Vote "Good" or "Bad" on community reports
3. **Claim Rewards**:
   - Reporters earn 5 WITH tokens when their report gets 2+ votes
   - Voters earn 1 WITH token when they vote on reports with 2+ total votes
4. **View Transparency**: See all voter addresses for each report

### Development

- Smart contracts: `packages/hardhat/contracts/`
- Frontend: `packages/nextjs/app/`
- Configuration: `packages/nextjs/scaffold.config.ts`


## 🔗 Smart Contract Details

### WhoIsThis Contract Functions

- `report(string _title)`: Create a new report
- `vote(uint256 _reportId, bool _isGood)`: Vote on a report (true = good, false = bad)
- `claimReporterReward(uint256 _reportId)`: Claim 5 WITH tokens as reporter
- `claimVoterReward(uint256 _reportId)`: Claim 1 WITH token as voter
- `getReport(uint256 _reportId)`: Get report details
- `getReportCount()`: Get total number of reports
- `hasVoterClaimed(uint256 _reportId, address _voter)`: Check if voter already claimed

### Reward System

- **Minimum Voters for Rewards**: 2 voters required
- **Reporter Reward**: 5 WITH tokens per qualifying report
- **Voter Reward**: 1 WITH token per qualifying vote
- **Token Supply**: WITH token with minting capabilities for rewards

## 🔍 Explorer Links

- **Monad Testnet Explorer**: https://testnet.monadexplorer.com
- **View WhoIsThis Contract**: https://testnet.monadexplorer.com/address/0xA0EB6dfEc8b60c5CC68D599c6DFDD8BbD797cF35
- **View WITH Token**: https://testnet.monadexplorer.com/address/0xe3599c93c092817f79Ec1e090998684B86343794

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is built using Scaffold-ETH 2 framework and follows MIT License.

## Demo
<img width="664" height="534" alt="Screenshot 2568-09-20 at 15 55 13" src="https://github.com/user-attachments/assets/53fce5b5-352e-4cba-a2da-3e75a9f22a40" />

<img width="663" height="778" alt="Screenshot 2568-09-20 at 16 05 46" src="https://github.com/user-attachments/assets/87400736-b0c1-4bb9-9b92-139c1ac88a30" />



