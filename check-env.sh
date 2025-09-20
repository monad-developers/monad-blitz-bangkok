#!/bin/bash

echo "🔧 Monad Arena Environment Setup"
echo "================================"

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found. Copying from template..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo "✅ Created .env from template"
    else
        echo "❌ .env.example not found! Please create it first."
        exit 1
    fi
fi

echo ""
echo "🔑 Environment Variable Status:"
echo "==============================="

# Check each required variable
check_var() {
    local var_name=$1
    local var_value=$(grep "^$var_name=" .env 2>/dev/null | cut -d '=' -f2- | tr -d '"' | tr -d "'")
    
    if [ -z "$var_value" ]; then
        echo "❌ $var_name: Not set"
        return 1
    elif [[ "$var_value" == *"your_"* ]] || [[ "$var_value" == *"_here"* ]]; then
        echo "⚠️  $var_name: Contains placeholder value"
        return 1
    else
        echo "✅ $var_name: Configured"
        return 0
    fi
}

# Check required variables
all_good=true

if ! check_var "ORACLE_PRIVATE_KEY"; then
    all_good=false
    echo "   💡 Generate with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
fi

if ! check_var "JWT_SECRET"; then
    all_good=false
    echo "   💡 Generate with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
fi

check_var "MONAD_TESTNET_RPC_URL"
check_var "DATABASE_URL"

echo ""
echo "📦 Contract Addresses:"
echo "======================"

check_var "GAME_TOKEN_ADDRESS"
check_var "ARENA_CONTRACT_ADDRESS" 
check_var "BADGES_CONTRACT_ADDRESS"

echo ""
if [ "$all_good" = true ]; then
    echo "🎉 Environment looks good! You can start the backend."
    echo ""
    echo "Next steps:"
    echo "1. cd backend && npm run dev"
    echo "2. cd frontend && npm run dev"
else
    echo "⚠️  Please fix the environment variables above."
    echo ""
    echo "Quick fixes:"
    echo "1. Edit .env file with real values"
    echo "2. Get testnet tokens: https://faucet.monad.xyz"
    echo "3. Deploy contracts: cd contracts && npm run deploy:testnet"
    echo "4. Update contract addresses in .env"
fi

echo ""
echo "🔗 Useful Links:"
echo "================"
echo "• Monad Faucet: https://faucet.monad.xyz"
echo "• Monad Explorer: https://testnet-explorer.monad.xyz"
echo "• WalletConnect: https://cloud.reown.com"