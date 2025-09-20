#!/bin/bash

# Monad Code Arena Development Starter Script
echo "🚀 Starting Monad Code Arena development environment..."

# Function to check if a port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        echo "⚠️  Port $1 is already in use"
        return 1
    else
        return 0
    fi
}

# Check required ports
echo "🔍 Checking ports..."
check_port 3000 || echo "Port 3000 (frontend) is busy"
check_port 3001 || echo "Port 3001 (backend) is busy"
check_port 8545 || echo "Port 8545 (hardhat) is busy"

echo "📦 Installing/updating dependencies..."
npm run install:all

echo "🏗️  Building shared package..."
cd shared && npm run build && cd ..

# Start services in background
echo "🔗 Starting local blockchain..."
cd contracts && npm run dev &
HARDHAT_PID=$!
cd ..

# Wait for hardhat to start
sleep 5

echo "📋 Deploying contracts to local network..."
cd contracts && npm run deploy:local
DEPLOY_STATUS=$?
cd ..

if [ $DEPLOY_STATUS -ne 0 ]; then
    echo "❌ Contract deployment failed"
    kill $HARDHAT_PID 2>/dev/null
    exit 1
fi

echo "🛠️  Starting backend service..."
cd backend && npm run dev &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 3

echo "🎨 Starting frontend..."
cd frontend && npm run dev &
FRONTEND_PID=$!
cd ..

echo "✅ All services started!"
echo ""
echo "🌐 Frontend: http://localhost:3000"
echo "🔌 Backend API: http://localhost:3001"
echo "⛓️  Local Blockchain: http://localhost:8545"
echo ""
echo "Press Ctrl+C to stop all services"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping all services..."
    kill $HARDHAT_PID 2>/dev/null
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo "✅ All services stopped"
    exit 0
}

# Set up signal handling
trap cleanup SIGINT SIGTERM

# Wait for services
wait