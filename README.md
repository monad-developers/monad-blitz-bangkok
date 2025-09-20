# Social Trading Detox

**Social Trading Detox** is a GameFi-powered app designed to help users stay focused and reduce smartphone addiction while earning rewards. By combining **DeFi trading tools**, **NFT gamification**, and **EIP-7702 delegated execution**, users are incentivized to stay off their devices and let their “monsters” mine rewards.

---

## ✨ Features

- **EIP-7702 Delegated Execution** — Temporary delegation of wallet actions to policy contracts.  
- **Stay-Focused Mining** — Rewards for setting a no-touch timer and sticking to it.  
- **Limit Orders & Auto Swap** — Execute swaps automatically to your wallet once price targets are hit.  
- **Auto Stake** — Automatically stake rewards into configured vaults.  
- **Dashboard & Notifications** — Track mining progress, vault balances, and get success notifications.  
- **NFT Rewards** — Evolving “monster” NFTs that upgrade as you succeed.  
- **Game Asset Tokenization** — Monsters and in-game items as tradable assets.  
- **Verifiable Random Function (VRF)** — Mini-games and loot drops with fair randomness.  

---

## 🕹 How It Works

1. **Login with Web3 Wallet**  
2. **Select a Monster Egg** and assign a focus task  
3. **Configure Mining Parameters**  
   - Token name / target price  
   - Focus duration (time you won’t touch your phone)  
4. **Start Focus Session**  
   - App tracks no-touch duration  
5. **Outcomes**  
   - ✅ **Success**: Summarized notification + extra rewards  
   - ❌ **Fail**: No notification, countdown continues, rewards reduced  
6. **Return to Dashboard & Vaults** to review performance and assets  
7. **Monster Upgrades** unlock chances to play mini-games with VRF-based big rewards  

---

## 🧱 Smart Contracts

- **Mining Contract** — Handles session tracking, reward logic, and penalties  
- **NFT Contract** — Manages monster eggs, evolutions, and upgrades  
- **Vault/Auto-Stake Contract** — Stakes earned tokens automatically  
- **Swap Router** — Executes limit orders and auto-swaps rewards  
- **Policy (EIP-7702)** — Delegated execution for user-approved actions  
- **Oracle & VRF (Mocks)** — Mocked locally until integrated with live testnet feeds  

---

## ⚠️ Limitations on Testnets

- Current testnets may not have live **oracle feeds** or **VRF services**.  
- For now, **mock contracts** are used for price feeds and randomness.  
- This limits completing the **full game loop** on test environments.  

---

## 📊 Roadmap

- [ ] Integrate live Chainlink Oracles & VRF  
- [ ] Expand dashboard analytics  
- [ ] Add push notifications (WalletConnect, Push Protocol)  
- [ ] Community leaderboards & social trading rooms  

## References

- [Figma](https://www.figma.com/proto/cZdhYwNitqwc3m1G3OSbZz/Untitled?node-id=1-86&p=f&t=q2dGwtIGW9NeL9tJ-1&scaling=min-zoom&content-scaling=fixed&page-id=0%3A1&starting-point-node-id=1%3A2)
---

## 🚀 Quick Start (Local Dev)
