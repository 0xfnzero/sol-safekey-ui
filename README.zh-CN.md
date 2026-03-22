# Sol SafeKey UI

<div align="center">

![Sol SafeKey UI](https://img.shields.io/badge/Solana-SafeKey%20UI-purple?style=for-the-badge&logo=solana)

完整的 Solana 钱包管理工具，提供高级安全功能和 18+ 种专业操作

[English](./README.md) | 简体中文

</div>

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

- Node.js 18+
- npm 或 yarn
- 后端 API 服务运行在 `http://localhost:3001`

### 安装

```bash
# 克隆项目
git clone https://github.com/0xfnzero/sol-safekey-ui.git
cd sol-safekey-ui

# 安装依赖
npm install
```

### 运行

```bash
# 启动开发服务器
npm run dev

# 在浏览器中打开
open http://localhost:3000
```

### 构建

```bash
# 生产环境构建
npm run build

# 启动生产服务器
npm start
```

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
