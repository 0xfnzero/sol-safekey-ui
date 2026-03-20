# Sol SafeKey UI

A secure web-based user interface for Solana wallet management, powered by Rust and Next.js.

## Features

- **Single Binary Deployment**: One executable starts both the backend and embedded frontend
- **18 Complete Features**: All sol-safekey CLI features implemented in the web UI
- **Three Authentication Methods**:
  - 📁 **Keystore File**: Upload encrypted keystore.json + password (most secure)
  - 🔒 **Encrypted Private Key**: Input encrypted key + decryption password
  - 🔑 **Plaintext Private Key**: Direct Base58 input (least secure, compatible)
- **Complete Feature Set**:
  1. Create Plaintext Key
  2. Create Encrypted Key
  3. Decrypt Key
  4. Setup 2FA Authentication
  5. Generate Triple-Factor Wallet (3FA)
  6. Unlock Triple-Factor Wallet
  7. Check SOL Balance
  8. Transfer SOL
  9. Create WSOL ATA
  10. Wrap SOL → WSOL
  11. Unwrap WSOL → SOL
  12. Close WSOL ATA
  13. Transfer SPL Token
  14. Create Nonce Account
  15. Pump.fun Sell
  16. PumpSwap Sell
  17. Pump.fun Cashback
  18. PumpSwap Cashback
- **Secure Encryption**: Military-grade password-based encryption
- **Modern UI**: Dark glassmorphism theme with smooth animations
- **Organized Menu**: Left sidebar with categorized features

## Tech Stack

- **Backend**: Rust with Axum web framework
- **Frontend**: Next.js 15 with TypeScript
- **UI**: Tailwind CSS with shadcn/ui components
- **Solana**: solana-sdk 3.0 and solana-client 3.1
- **Security**: sol-safekey library with "solana-ops", "2fa", "sol-trade-sdk" features

## Prerequisites

- Rust toolchain (1.70+)
- Node.js 18+ and npm
- Cargo package manager

## Quick Start

### Development

For development with hot reload:

```bash
./dev.sh
```

This will:
1. Start the Rust backend with auto-reload
2. Start the Next.js development server
3. Open the web UI at http://localhost:3000

### Production Build

```bash
./build.sh
```

This will:
1. Build the Next.js frontend to static files
2. Build the Rust backend with embedded frontend
3. Create the optimized binary at `./target/release/sol-safekey-ui`

### Running the Application

After building, start the application:

```bash
./start.sh
```

Or run the binary directly:

```bash
./target/release/sol-safekey-ui
```

The web UI will be available at **http://localhost:3001**

## Usage

### Authentication Methods

The application supports three authentication methods (Keystore is default):

1. **📁 Keystore File (Recommended)**: Upload your encrypted keystore.json file and enter the password
2. **🔒 Encrypted Key**: Paste your encrypted private key and enter the decryption password
3. **🔑 Private Key**: Enter your plaintext private key in Base58 format (use with caution)

### Core Features

**Key Management**
- Create new Solana keypairs
- Create encrypted keypairs with password protection
- Create keystore files for maximum security
- Decrypt encrypted keys
- Import existing wallets from keystore files

**Advanced Security**
- Setup 2FA (Two-Factor Authentication)
- Generate triple-factor wallets (3FA)
- Unlock triple-factor wallets

**Wallet Operations**
- Unlock wallet from keystore/encrypted key/plaintext key
- Check SOL balance on mainnet or devnet
- Get public key from private key

**Transfers**
- Transfer SOL to any address
- Transfer SPL tokens with custom mint addresses and decimals

**WSOL Operations**
- Create WSOL Associated Token Account (ATA)
- Wrap SOL to WSOL
- Unwrap WSOL to SOL
- Close WSOL ATA

**Advanced Operations**
- Create Nonce accounts for offline transactions

**Pump.fun/PumpSwap**
- Sell tokens on Pump.fun
- Sell tokens on PumpSwap
- Cashback operations (info only, requires CLI)

## API Endpoints

The backend provides comprehensive API endpoints:

### Key Management
- `POST /api/keys/create` - Create plaintext keypair
- `POST /api/keys/encrypt` - Encrypt keypair with password
- `POST /api/keys/decrypt` - Decrypt encrypted key
- `POST /api/keys/create-keystore` - Create keystore file
- `POST /api/keys/import-keystore` - Import from keystore file

### Wallet Operations
- `POST /api/wallet/unlock` - Unlock wallet
- `POST /api/wallet/balance` - Check SOL balance
- `POST /api/wallet/get-pubkey` - Get public key

### Transfers
- `POST /api/transfer/sol` - Transfer SOL
- `POST /api/transfer/token` - Transfer SPL Token

### WSOL Operations
- `POST /api/wsol/create-ata` - Create WSOL ATA
- `POST /api/wsol/wrap` - Wrap SOL → WSOL
- `POST /api/wsol/unwrap` - Unwrap WSOL → SOL
- `POST /api/wsol/close-ata` - Close WSOL ATA

### Advanced Security
- `POST /api/2fa/setup` - Setup 2FA
- `POST /api/2fa/create-tfa` - Create triple-factor wallet
- `POST /api/2fa/unlock-tfa` - Unlock triple-factor wallet

### Advanced Operations
- `POST /api/nonce/create` - Create Nonce account

### Pump.fun/PumpSwap
- `POST /api/pumpfun/sell` - Sell on Pump.fun
- `POST /api/pumpfun/cashback` - Pump.fun cashback info
- `POST /api/pumpswap/sell` - Sell on PumpSwap
- `POST /api/pumpswap/cashback` - PumpSwap cashback info

## Security Notes

⚠️ **Important Security Guidelines**:

- **Never share your private keys**, keystore files, or passwords
- **Use strong passwords** (10-20+ characters recommended)
- **Back up your keystore files** in multiple secure locations
- **Keystore files are the most secure** method for storing keys
- **The application runs locally** - your keys never leave your machine
- **Mainnet transactions are real** - double-check all addresses before confirming
- **Use devnet for testing** to avoid losing real funds

### Best Practices

1. Always use Keystore files for long-term storage
2. Test transactions on devnet first
3. Verify recipient addresses before sending
4. Keep your keystore backups encrypted and secure
5. Use strong, unique passwords for each keystore

## Configuration

The application supports both mainnet and devnet:

**Default Configuration**:
- RPC URLs:
  - Mainnet: `https://api.mainnet-beta.solana.com`
  - Devnet: `https://api.devnet.solana.com`
- Server port: `3001`

**Switching Networks**:
Use the network dropdown in supported operations, or modify `DEFAULT_RPC_URL` in `main.rs`.

## Project Structure

```
sol-safekey-ui/
├── src/                    # Next.js frontend source
│   ├── app/               # App router pages
│   └── components/        # React components
│       └── ui/            # shadcn/ui components
├── sol-safekey/           # sol-safekey library (submodule)
├── main.rs                # Rust backend entry point
├── Cargo.toml             # Rust dependencies
├── package.json           # Node.js dependencies
├── build.sh               # Build script
├── start.sh               # Start script
└── dev.sh                 # Development script
```

## Error Handling

The application includes comprehensive error handling:

- Invalid private keys return clear error messages (no server crashes)
- Network errors are displayed with actionable feedback
- Transaction failures show detailed error descriptions
- Form validation prevents invalid inputs

## Building from Source

If you want to build the project manually:

```bash
# Install frontend dependencies
npm install

# Build frontend
npm run build

# Build Rust binary
cargo build --release

# Run the binary
./target/release/sol-safekey-ui
```

## Troubleshooting

**Server won't start**:
- Check if port 3001 is already in use: `lsof -i :3001`
- Kill existing process: `pkill -f sol-safekey-ui`

**Frontend not updating**:
- Run `npm run build` to rebuild frontend
- Run `cargo build --release` to re-embed frontend
- Restart the server

**Transaction failures**:
- Verify you have enough SOL for fees
- Check if RPC endpoint is accessible
- Ensure you're using the correct network (mainnet/devnet)

## License

This project is built on top of [sol-safekey](https://github.com/0xfnzero/sol-safekey) and follows its licensing terms.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Acknowledgments

- [sol-safekey](https://github.com/0xfnzero/sol-safekey) - Core security library
- [Next.js](https://nextjs.org/) - React framework
- [shadcn/ui](https://ui.shadcn.com/) - UI components
- [Solana](https://solana.com/) - Blockchain platform
- [Axum](https://github.com/tokio-rs/axum) - Rust web framework
