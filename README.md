# Sol SafeKey UI

<div align="center">

![Sol SafeKey UI](https://img.shields.io/badge/Solana-SafeKey%20UI-purple?style=for-the-badge&logo=solana)

Complete Solana wallet management tool with advanced security features and 18+ professional operations

English | [简体中文](./README.zh-CN.md)

</div>

---

## ✨ Features

### 🔑 Core Features
- **1. Create Plain Private Key** - Generate new Solana keypair
- **2. Create Encrypted Private Key** - Encrypt private key with password
- **Create Keystore File** - Standardized key storage format

### 📥 Import Wallet
- **Import Keystore File** - Restore wallet from JSON file
- **3. Decrypt Private Key** - Decrypt encrypted private key

### 🛡️ Advanced Security
- **4. Setup 2FA Authentication** - Configure two-factor authentication
- **5. Create Triple Wallet (3FA)** - Ultimate security wallet
- **6. Unlock Triple Wallet** - Unlock with multi-factor authentication

### 💰 Wallet Operations
- **U. Unlock Wallet** - Unlock using Keystore
- **7. Check SOL Balance** - Check wallet balance
- **Get Public Key** - Derive public key from private key

### 💸 Transfers
- **8. Transfer SOL** - Send SOL tokens
- **13. Transfer SPL Token** - Send SPL tokens

### 🔄 WSOL Operations
- **9. Create WSOL ATA** - Create Wrapped SOL token account
- **10. Wrap SOL → WSOL** - Wrap SOL to WSOL
- **11. Unwrap WSOL → SOL** - Unwrap WSOL to SOL
- **12. Close WSOL ATA** - Close token account

### 💎 Pump.fun/PumpSwap
- **15. Pump.fun Sell** - Sell on Pump.fun platform
- **16. PumpSwap Sell** - Sell on PumpSwap platform
- **17. Pump.fun Cashback** - Claim trading rebates
- **18. PumpSwap Cashback** - Claim trading rebates

### ⚙️ Advanced Operations
- **14. Create Nonce Account** - Create durable transaction account

## 🌍 Internationalization

- 🇬🇧 English support
- 🇨🇳 Chinese support
- One-click language switching

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Backend API service running on `http://localhost:3001`

### Installation

```bash
# Clone the repository
git clone https://github.com/0xfnzero/sol-safekey-ui.git
cd sol-safekey-ui

# Install dependencies
npm install
```

### Running

```bash
# Start development server
npm run dev

# Open in browser
open http://localhost:3000
```

### Build

```bash
# Production build
npm run build

# Start production server
npm start
```

## 📖 Usage Guide

1. **Select Feature** - Choose desired feature from left sidebar
2. **Choose Auth Method** - Keystore file or private key
3. **Fill Form** - Complete required information
4. **Execute** - Click button to perform operation

### Authentication Methods

- **📁 Keystore File** (Recommended) - More secure file-based storage
- **🔑 Private Key** - Direct private key (use with caution)
- **🔐 Encrypted Key** - Password-encrypted private key

## 🏗️ Project Structure

```
sol-safekey-ui/
├── src/
│   ├── app/              # Next.js app directory
│   │   └── [locale]/     # Internationalized routes
│   ├── components/       # React components
│   ├── i18n/            # i18n configuration
│   ├── messages/        # Translation files
│   └── lib/             # Utility functions
├── public/              # Static assets
└── package.json         # Dependencies
```

## 🔧 Tech Stack

- **Framework**: Next.js 15
- **UI**: React 19, Tailwind CSS
- **i18n**: next-intl
- **Icons**: Lucide React
- **Notifications**: Sonner

## ⚠️ Security Tips

- 🔒 **NEVER** share your private keys with anyone
- 📁 **RECOMMENDED** Use Keystore files for storage
- 💾 **KEEP SAFE** your passwords and recovery phrases
- 🧪 **TEST** on Devnet first before using mainnet

## 📝 Development

```bash
# Lint code
npm run lint

# Type check
npm run type-check
```

## 🤝 Contributing

Issues and Pull Requests are welcome!

## 📄 License

MIT License

## 🔗 Related Links

- [Solana Website](https://solana.com/)
- [Solana Docs](https://docs.solana.com/)
- [Next.js Docs](https://nextjs.org/docs)

---

<div align="center">

**⭐ If you find this project helpful, please give it a star!**

Made with ❤️ by Solana Community

</div>
