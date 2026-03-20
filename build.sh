#!/bin/bash

set -e

echo "🔨 Building Sol SafeKey UI..."

# Build frontend
echo "📦 Building Next.js frontend..."
npm run build

# Build backend with embedded frontend
echo "🦀 Building Rust backend with embedded frontend..."
cargo build --release

echo "✅ Build complete!"
echo ""
echo "To run the application:"
echo "  ./target/release/sol-safekey-ui"
echo ""
echo "The web UI will be available at http://localhost:3001"
