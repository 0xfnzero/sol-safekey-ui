#!/bin/bash

# Development script - runs frontend in dev mode and backend separately

set -e

echo "🚀 Starting Sol SafeKey UI in development mode..."

# Check if running backend
if [ "$1" == "backend" ]; then
    echo "🦀 Starting Rust backend..."
    cargo run
    exit 0
fi

# Check if running frontend
if [ "$1" == "frontend" ]; then
    echo "📦 Starting Next.js frontend..."
    npm run dev
    exit 0
fi

# Default: show help
echo "Usage:"
echo "  ./dev.sh backend  - Start Rust backend only"
echo "  ./dev.sh frontend - Start Next.js frontend only"
echo ""
echo "For development, run frontend and backend in separate terminals:"
echo "  Terminal 1: ./dev.sh backend"
echo "  Terminal 2: ./dev.sh frontend"
echo ""
echo "Frontend will be at http://localhost:3000"
echo "Backend API will be at http://localhost:3001"
