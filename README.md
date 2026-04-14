<div align="center">
    <h1>🔐 Sol SafeKey UI</h1>
    <h3><em>Secure Web-Based Solana Wallet Management Interface</em></h3>
</div>

<p align="center">
    <strong>A comprehensive, secure web interface for Solana wallet management with 18+ professional operations. Built with Next.js and featuring advanced security features including 2FA/3FA authentication, keystore file support, and seamless integration with sol-safekey backend.</strong>
</p>

<p align="center">
    <a href="https://github.com/0xfnzero/sol-safekey-ui/blob/main/LICENSE">
        <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License">
    </a>
    <a href="https://github.com/0xfnzero/sol-safekey-ui">
        <img src="https://img.shields.io/github/stars/0xfnzero/sol-safekey-ui?style=social" alt="GitHub stars">
    </a>
    <a href="https://github.com/0xfnzero/sol-safekey-ui/network">
        <img src="https://img.shields.io/github/forks/0xfnzero/sol-safekey-ui?style=social" alt="GitHub forks">
    </a>
</p>

<p align="center">
    <img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js">
    <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React">
    <img src="https://img.shields.io/badge/Solana-9945FF?style=for-the-badge&logo=solana&logoColor=white" alt="Solana">
    <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
</p>

<p align="center">
    <a href="https://github.com/0xfnzero/sol-safekey-ui/blob/main/README.zh-CN.md">中文</a> |
    <a href="https://github.com/0xfnzero/sol-safekey-ui/blob/main/README.md">English</a> |
    <a href="https://fnzero.dev/">Website</a> |
    <a href="https://t.me/fnzero_group">Telegram</a> |
    <a href="https://discord.gg/vuazbGkqQE">Discord</a>
</p>

## 📋 Table of Contents

- [✨ Features](#-features)
- [🌍 Internationalization](#-internationalization)
- [🚀 Quick Start](#-quick-start)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Running](#running)
  - [Build](#build)
- [📖 Usage Guide](#-usage-guide)
  - [Authentication Methods](#authentication-methods)
- [🏗️ Project Structure](#-project-structure)
- [🔧 Tech Stack](#-tech-stack)
- [⚠️ Security Tips](#-security-tips)
- [📝 Development](#-development)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)
- [🔗 Related Links](#-related-links)
- [💬 Contact](#-contact)

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

- **Node.js** 18+
- **npm** or **yarn**
- **Rust** (stable) — required for the HTTP API (`cargo run`) and the Tauri desktop shell
- **sol-safekey** as a **sibling folder**: this repo’s `Cargo.toml` depends on `../sol-safekey`. Clone it next to this project, for example:

  ```
  your-workspace/
    sol-safekey/      # dependency (Rust library)
    sol-safekey-ui/   # this repository
  ```

- **Desktop only:** satisfy [Tauri 2 prerequisites](https://v2.tauri.app/start/prerequisites/) (OS-specific compiler, WebView, etc.)

### Installation

```bash
git clone https://github.com/0xfnzero/sol-safekey-ui.git
cd sol-safekey-ui
npm install
```

### Running — Web (browser)

Default ports: **Next.js UI = 3840**, **Rust API = 3841**.

| Goal | Command | Then open |
|------|---------|-----------|
| **UI only** (no API; wallet actions will fail until the API runs) | `npm run dev` | `http://localhost:3840/en/` or `http://localhost:3840/zh/` |
| **UI + API** (recommended for local development) | `npm run dev:stack` | Same URLs as above; `/api/*` is proxied to `http://127.0.0.1:3841` |
| **API only** (e.g. Next already running elsewhere) | `npm run backend` | Ensure something is still serving the UI on 3840 if you use the browser |

### Running — Desktop (Tauri)

```bash
npm run desktop:dev
```

This starts the same stack as `dev:stack` (Next + API) via Tauri’s `beforeDevCommand`, then opens the native window.

- **Release build / installer:** `npm run desktop:build` (artifacts under `src-tauri/target/` and OS-specific bundles).

### Build (static export)

```bash
npm run build
```

Output goes to `out/` (used by the embedded Rust server and Tauri).

### Pushing to GitHub

```bash
git add .
git status
git commit -m "chore: your message"
git push origin main
```

Replace `main` with your branch name if different.

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

## 💬 Contact

- **Official Website**: https://fnzero.dev/
- **Project Repository**: https://github.com/0xfnzero/sol-safekey-ui
- **Telegram Group**: https://t.me/fnzero_group
- **Discord**: https://discord.gg/vuazbGkqQE

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
