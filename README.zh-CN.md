<div align="center">
    <h1>🔐 Sol SafeKey UI</h1>
    <h3><em>安全的基于 Web 的 Solana 钱包管理界面</em></h3>
</div>

<p align="center">
    <strong>一个全面的、安全的 Solana 钱包管理 Web 界面，提供 18+ 种专业操作。使用 Next.js 构建，具有高级安全功能，包括 2FA/3FA 认证、Keystore 文件支持，以及与 sol-safekey 后端的无缝集成。</strong>
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
    <a href="https://fnzero.dev/">官网</a> |
    <a href="https://t.me/fnzero_group">Telegram</a> |
    <a href="https://discord.gg/vuazbGkqQE">Discord</a>
</p>

## 📋 目录

- [✨ 功能特性](#-功能特性)
- [🌍 国际化](#-国际化)
- [🚀 快速开始](#-快速开始)
  - [前置要求](#-前置要求)
  - [安装](#-安装)
  - [运行](#-运行)
  - [构建](#-构建)
- [📖 使用说明](#-使用说明)
  - [认证方式](#-认证方式)
- [🏗️ 项目结构](#-项目结构)
- [🔧 技术栈](#-技术栈)
- [⚠️ 安全提示](#-安全提示)
- [📝 开发](#-开发)
- [🤝 贡献](#-贡献)
- [📄 许可证](#-许可证)
- [🔗 相关链接](#-相关链接)
- [💬 联系方式](#-联系方式)

---

## ✨ 功能特性

### 🔑 核心功能
- **1. 创建明文私钥** - 生成新的 Solana 密钥对
- **2. 创建加密私钥** - 使用密码加密私钥
- **创建 Keystore 文件** - 标准化的密钥存储格式

### 📥 导入钱包
- **导入 Keystore 文件** - 从 JSON 文件恢复钱包
- **3. 解密私钥** - 解密加密的私钥

### 🛡️ 高级安全
- **4. 设置 2FA 认证** - 配置双因素认证
- **5. 生成三重钱包 (3FA)** - 创建终极安全钱包
- **6. 解锁三重钱包** - 使用多重认证解锁

### 💰 钱包操作
- **U. 解锁钱包** - 使用 Keystore 解锁
- **7. 查询 SOL 余额** - 检查钱包余额
- **获取公钥** - 从私钥获取公钥

### 💸 转账
- **8. 转账 SOL** - 发送 SOL 代币
- **13. 转账 SPL Token** - 发送 SPL 代币

### 🔄 WSOL 操作
- **9. 创建 WSOL ATA** - 创建 Wrapped SOL 代币账户
- **10. 封装 SOL → WSOL** - 将 SOL 封装为 WSOL
- **11. 解封 WSOL → SOL** - 将 WSOL 解封为 SOL
- **12. 关闭 WSOL ATA** - 关闭代币账户

### 💎 Pump.fun/PumpSwap
- **15. Pump.fun 卖出** - 在 Pump.fun 平台卖出
- **16. PumpSwap 卖出** - 在 PumpSwap 平台卖出
- **17. Pump.fun 返现** - 领取交易返现
- **18. PumpSwap 返现** - 领取交易返现

### ⚙️ 高级操作
- **14. 创建 Nonce 账户** - 创建永久交易账户

## 🌍 国际化

- 🇬🇧 英文支持
- 🇨🇳 中文支持
- 一键语言切换

## 🚀 快速开始

### 前置要求

- **Node.js** 18+
- **npm** 或 **yarn**
- **Rust**（stable）— 运行 HTTP API（`cargo run`）和 Tauri 桌面壳都需要
- **sol-safekey** 与本仓库**同级目录**：根目录 `Cargo.toml` 使用 `path = "../sol-safekey"`，请把 [sol-safekey](https://github.com/0xfnzero/sol-safekey) 克隆到上一级目录，例如：

  ```
  你的工作目录/
    sol-safekey/      # 依赖库
    sol-safekey-ui/   # 本仓库
  ```

- **仅桌面端：** 还需满足 [Tauri 2 环境要求](https://v2.tauri.app/start/prerequisites/)（系统编译器、WebView 等）

### 安装

```bash
git clone https://github.com/0xfnzero/sol-safekey-ui.git
cd sol-safekey-ui
npm install
```

### 启动 — Web 浏览器

默认端口：**Next 前端 3840**，**Rust API 3841**。

| 需求 | 命令 | 浏览器访问 |
|------|------|------------|
| **只要界面**（无后端，链上操作会失败） | `npm run dev` | `http://localhost:3840/zh/` 或 `http://localhost:3840/en/` |
| **前端 + API**（本地开发推荐） | `npm run dev:stack` | 同上；开发时 `/api` 会转发到 `http://127.0.0.1:3841` |
| **只起后端**（例如前端已在别的终端跑） | `npm run backend` | 需自行保证 3840 上仍有页面服务 |

### 启动 — 桌面端（Tauri）

```bash
npm run desktop:dev
```

会通过 Tauri 的 `beforeDevCommand` 拉起与 `dev:stack` 相同的一键栈（Next + API），再打开原生窗口。

- **打安装包 / 发布构建：** `npm run desktop:build`（产物在 `src-tauri/target/` 及系统对应的安装包目录）

### 构建（静态导出）

```bash
npm run build
```

生成目录为 `out/`（供 Rust 内嵌静态资源与 Tauri 使用）。

### 提交代码到 GitHub

```bash
git add .
git status
git commit -m "chore: 说明本次修改"
git push origin main
```

若默认分支不是 `main`，请改成你的分支名。

## 📖 使用说明

1. **选择功能** - 从左侧菜单选择所需功能
2. **选择认证方式** - 支持 Keystore 文件或私钥
3. **填写表单** - 根据功能要求填写相应信息
4. **执行操作** - 点击按钮执行操作

### 认证方式

- **📁 Keystore 文件** (推荐) - 更安全的文件存储方式
- **🔑 私钥** - 直接使用私钥（谨慎使用）
- **🔐 加密密钥** - 使用密码加密的私钥

## 🏗️ 项目结构

```
sol-safekey-ui/
├── src/
│   ├── app/              # Next.js 应用目录
│   │   └── [locale]/     # 国际化路由
│   ├── components/       # React 组件
│   ├── i18n/            # 国际化配置
│   ├── messages/        # 翻译文件
│   └── lib/             # 工具函数
├── public/              # 静态资源
└── package.json         # 依赖配置
```

## 🔧 技术栈

- **框架**: Next.js 15
- **UI**: React 19, Tailwind CSS
- **国际化**: next-intl
- **图标**: Lucide React
- **通知**: Sonner

## ⚠️ 安全提示

- 🔒 **切勿**将私钥泄露给任何人
- 📁 **推荐**使用 Keystore 文件存储
- 💾 **妥善保管**密码和恢复短语
- 🧪 **测试**建议先在 Devnet 测试

## 📝 开发

```bash
# 代码检查
npm run lint

# 类型检查
npm run type-check
```

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 💬 联系方式

- **官方网站**: https://fnzero.dev/
- **项目仓库**: https://github.com/0xfnzero/sol-safekey-ui
- **Telegram 群组**: https://t.me/fnzero_group
- **Discord**: https://discord.gg/vuazbGkqQE

## 📄 许可证

MIT License

## 🔗 相关链接

- [Solana 官网](https://solana.com/)
- [Solana 文档](https://docs.solana.com/)
- [Next.js 文档](https://nextjs.org/docs)

---

<div align="center">

**⭐ 如果这个项目对你有帮助，请给它一个 Star！**

Made with ❤️ by Solana Community

</div>
