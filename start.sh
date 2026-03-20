#!/bin/bash

# Start script for sol-safekey-ui

set -e

echo "🚀 Starting Sol SafeKey UI..."

# Check if the binary exists
if [ ! -f "./target/release/sol-safekey-ui" ]; then
    echo "⚠️  Binary not found. Building first..."
    cargo build --release
fi

# Start the server
echo "✅ Starting server at http://localhost:3001"
echo "📱 Open your browser and navigate to http://localhost:3001"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

./target/release/sol-safekey-ui
