# ⚠️ Environment Setup Required

The backend service failed to start because environment variables are not properly configured.

## Quick Fix

1. **Copy the environment template:**
   ```bash
   cp .env.example .env
   ```

2. **Edit your `.env` file and replace these placeholder values:**

   ```bash
   # Replace with your actual private key (without 0x prefix)
   ORACLE_PRIVATE_KEY=your_actual_64_character_private_key_here
   
   # Generate a secure JWT secret (at least 32 characters)
   JWT_SECRET=your_secure_jwt_secret_at_least_32_characters_long
   
   # Set contract addresses after deployment
   GAME_TOKEN_ADDRESS=
   ARENA_CONTRACT_ADDRESS=
   BADGES_CONTRACT_ADDRESS=
   ```

3. **Get a private key:**
   - Create a new wallet in MetaMask
   - Export the private key (Settings > Security & Privacy > Show Private Key)
   - Or generate one programmatically:
     ```bash
     node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
     ```

4. **Generate JWT secret:**
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

5. **Get testnet tokens:**
   - Visit: https://faucet.monad.xyz
   - Add your wallet address to get testnet MON tokens

## Development Mode (Without Contracts)

If you want to run the backend without contracts for testing:

1. Set these minimal environment variables:
   ```bash
   ORACLE_PRIVATE_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
   JWT_SECRET=development_jwt_secret_change_in_production_min_32_chars
   DATABASE_URL=file:./monad_arena.db
   MONAD_TESTNET_RPC_URL=https://testnet-rpc.monad.xyz
   ```

2. Comment out contract initialization in `BlockchainService.ts`

## Next Steps

After fixing environment variables:
1. `cd backend && npm run dev` - Start backend
2. `cd frontend && npm run dev` - Start frontend  
3. `cd contracts && npm run deploy:testnet` - Deploy contracts
4. Update contract addresses in environment files