Dice Party Demo Project for Monad Blitz Hackathon.
It's smart contract project use in Dice Party Game on WebGL.


GameReward is a Solidity smart contract designed for distributing native MON rewards directly to players, without relying on an external vault or GameBank.
It can be funded with MON (the native token on Monad) and allows players to claim rewards based on their rank after a game session.

Key Features
	•	Native MON Rewards – Rewards are distributed directly from the contract’s balance.
	•	Configurable Reward Table – Owner can set or update reward amounts for each rank.
	•	Multiple Funding Options – Fund the contract by sending MON directly or calling the fund() function with msg.value.
	•	Secure Claims – Players call claim(rank) to receive rewards; protected by ReentrancyGuard.
	•	Admin Tools – Owner can update rewards, set max rank, or withdraw excess MON (rescue).
	•	Events – Transparent logging for all claims, funding, and configuration changes.

Default Reward Table
	•	Rank 1 → 150 MON
	•	Rank 2 → 50 MON
	•	Rank 3 → 25 MON

Example Flow
	1.	Owner deploys the contract and funds it with MON.
	2.	Players call claim(rank) after a game ends, receiving their reward directly.
	3.	The contract emits RewardClaimed events for on-chain transparency.