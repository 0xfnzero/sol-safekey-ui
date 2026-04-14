#!/bin/bash

# Development script - runs frontend in dev mode and backend separately

set -e

echo "🚀 Starting Sol SafeKey UI in development mode..."

# Check if running backend
if [ "$1" == "backend" ]; then
    echo "🦀 Starting Rust API (sol-safekey-ui on :3841)..."
    if [ ! -d "out" ]; then
      echo "📦 Building static out/ for rust-embed..."
      npm run build
    fi
    cargo run --release
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
echo "Recommended (Next + API together):"
echo "  npm run dev:stack"
echo "Or Tauri desktop:"
echo "  npm run desktop:dev"
echo ""
echo "Or two terminals:"
echo "  Terminal 1: ./dev.sh backend"
echo "  Terminal 2: ./dev.sh frontend"
echo ""
echo "Frontend: http://localhost:3840"
echo "Backend API: http://localhost:3841"
