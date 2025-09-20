#!/bin/bash

# Monad Code Arena Setup Script
echo "🚀 Setting up Monad Code Arena..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ and try again."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm and try again."
    exit 1
fi

echo "📦 Installing dependencies..."

# Install root dependencies
npm install

# Install shared dependencies
echo "Installing shared package dependencies..."
cd shared && npm install && cd ..

# Install contract dependencies
echo "Installing contract dependencies..."
cd contracts && npm install && cd ..

# Install backend dependencies
echo "Installing backend dependencies..."
cd backend && npm install && cd ..

# Install frontend dependencies
echo "Installing frontend dependencies..."
cd frontend && npm install && cd ..

echo "📄 Setting up environment files..."

# Copy environment files if they don't exist
if [ ! -f .env ]; then
    cp .env.example .env
    echo "✅ Created .env file from template"
    echo "⚠️  Please fill in your environment variables in .env"
else
    echo "📋 .env file already exists"
fi

if [ ! -f frontend/.env.local ]; then
    cp frontend/.env.local.example frontend/.env.local
    echo "✅ Created frontend/.env.local file from template"
    echo "⚠️  Please fill in your environment variables in frontend/.env.local"
else
    echo "📋 frontend/.env.local file already exists"
fi

echo "🏗️  Building shared package..."
cd shared && npm run build && cd ..

echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Fill in environment variables in .env and frontend/.env.local"
echo "2. Start local blockchain: cd contracts && npm run dev"
echo "3. Deploy contracts: cd contracts && npm run deploy:local"
echo "4. Start backend: cd backend && npm run dev"
echo "5. Start frontend: cd frontend && npm run dev"
echo ""
echo "Happy coding! 🎮"