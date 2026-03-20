# Sol SafeKey UI

一个安全的基于 Web 的 Solana 钱包管理界面，由 Rust 和 Next.js 驱动。

## 功能特性

- **单一可执行文件部署**: 一个可执行文件同时启动后端和嵌入的前端
- **18 个完整功能**: sol-safekey CLI 的所有功能都在 Web UI 中实现
- **三种认证方式**:
  - 📁 **Keystore 文件**: 上传加密的 keystore.json + 密码（最安全）
  - 🔒 **加密私钥**: 输入加密私钥 + 解密密码
  - 🔑 **明文私钥**: 直接输入 Base58 格式（最不安全，兼容性最好）
- **完整的功能集**:
  1. 创建明文私钥
  2. 创建加密私钥
  3. 解密私钥
  4. 设置 2FA 认证
  5. 生成三重钱包 (3FA)
  6. 解锁三重钱包
  7. 查询 SOL 余额
  8. 转账 SOL
  9. 创建 WSOL ATA
  10. 封装 SOL → WSOL
  11. 解封 WSOL → SOL
  12. 关闭 WSOL ATA
  13. 转账 SPL Token
  14. 创建 Nonce 账户
  15. Pump.fun 卖出
  16. PumpSwap 卖出
  17. Pump.fun 返现
  18. PumpSwap 返现
- **安全加密**: 军用级密码加密算法
- **现代化 UI**: 深色玻璃态主题，流畅动画
- **分类菜单**: 左侧边栏按功能分类整理

## 技术栈

- **后端**: Rust + Axum Web 框架
- **前端**: Next.js 15 + TypeScript
- **UI**: Tailwind CSS + shadcn/ui 组件
- **Solana**: solana-sdk 3.0 和 solana-client 3.1
- **安全**: sol-safekey 库，启用 "solana-ops"、"2fa"、"sol-trade-sdk" 特性

## 环境要求

- Rust 工具链 (1.70+)
- Node.js 18+ 和 npm
- Cargo 包管理器

## 快速开始

### 开发模式

使用热重载功能进行开发：

```bash
./dev.sh
```

这将：
1. 启动自动重载的 Rust 后端
2. 启动 Next.js 开发服务器
3. 在浏览器中打开 http://localhost:3000

### 生产构建

```bash
./build.sh
```

这将：
1. 构建前端到静态文件
2. 构建嵌入前端的后端
3. 在 `./target/release/sol-safekey-ui` 创建优化的二进制文件

### 运行应用

构建完成后，启动应用：

```bash
./start.sh
```

或直接运行二进制文件：

```bash
./target/release/sol-safekey-ui
```

Web UI 将在 **http://localhost:3001** 访问

## 使用方法

### 认证方式

应用支持三种认证方式（默认为 Keystore）：

1. **📁 Keystore 文件（推荐）**: 上传加密的 keystore.json 文件并输入密码
2. **🔒 加密私钥**: 粘贴加密的私钥并输入解密密码
3. **🔑 明文私钥**: 输入 Base58 格式的明文私钥（谨慎使用）

### 核心功能

**密钥管理**
- 创建新的 Solana 密钥对
- 使用密码保护创建加密密钥对
- 创建 keystore 文件以获得最高安全性
- 解密加密的密钥
- 从 keystore 文件导入现有钱包

**高级安全**
- 设置 2FA（双因素认证）
- 生成三重钱包 (3FA)
- 解锁三重钱包

**钱包操作**
- 从 keystore/加密密钥/明文密钥解锁钱包
- 查询主网或测试网的 SOL 余额
- 从私钥获取公钥

**转账**
- 转账 SOL 到任意地址
- 转账 SPL Token，支持自定义 mint 地址和小数位数

**WSOL 操作**
- 创建 WSOL 关联代币账户 (ATA)
- 封装 SOL 为 WSOL
- 解封 WSOL 为 SOL
- 关闭 WSOL ATA

**高级操作**
- 创建 Nonce 账户用于离线交易

**Pump.fun/PumpSwap**
- 在 Pump.fun 上卖出代币
- 在 PumpSwap 上卖出代币
- 返现操作（仅信息，需要使用 CLI）

## API 接口

后端提供完整的 API 接口：

### 密钥管理
- `POST /api/keys/create` - 创建明文密钥对
- `POST /api/keys/encrypt` - 使用密码加密密钥对
- `POST /api/keys/decrypt` - 解密加密的密钥
- `POST /api/keys/create-keystore` - 创建 keystore 文件
- `POST /api/keys/import-keystore` - 从 keystore 文件导入

### 钱包操作
- `POST /api/wallet/unlock` - 解锁钱包
- `POST /api/wallet/balance` - 查询 SOL 余额
- `POST /api/wallet/get-pubkey` - 获取公钥

### 转账
- `POST /api/transfer/sol` - 转账 SOL
- `POST /api/transfer/token` - 转账 SPL Token

### WSOL 操作
- `POST /api/wsol/create-ata` - 创建 WSOL ATA
- `POST /api/wsol/wrap` - 封装 SOL → WSOL
- `POST /api/wsol/unwrap` - 解封 WSOL → SOL
- `POST /api/wsol/close-ata` - 关闭 WSOL ATA

### 高级安全
- `POST /api/2fa/setup` - 设置 2FA
- `POST /api/2fa/create-tfa` - 创建三重钱包
- `POST /api/2fa/unlock-tfa` - 解锁三重钱包

### 高级操作
- `POST /api/nonce/create` - 创建 Nonce 账户

### Pump.fun/PumpSwap
- `POST /api/pumpfun/sell` - 在 Pump.fun 卖出
- `POST /api/pumpfun/cashback` - Pump.fun 返现信息
- `POST /api/pumpswap/sell` - 在 PumpSwap 卖出
- `POST /api/pumpswap/cashback` - PumpSwap 返现信息

## 安全注意事项

⚠️ **重要安全指南**:

- **永远不要分享您的私钥**、keystore 文件或密码
- **使用强密码**（建议 10-20+ 个字符）
- **在多个安全位置备份 keystore 文件**
- **Keystore 文件是最安全**的密钥存储方式
- **应用在本地运行** - 您的密钥永远不会离开您的机器
- **主网交易是真实的** - 确认前请仔细检查所有地址
- **在测试网上测试**以避免丢失真实资金

### 最佳实践

1. 长期存储始终使用 Keystore 文件
2. 首先在测试网上测试交易
3. 发送前验证接收地址
4. 保持 keystore 备份加密并安全存储
5. 每个 keystore 使用强、唯一的密码

## 配置

应用支持主网和测试网：

**默认配置**:
- RPC 地址:
  - 主网: `https://api.mainnet-beta.solana.com`
  - 测试网: `https://api.devnet.solana.com`
- 服务器端口: `3001`

**切换网络**:
在支持的操作中使用网络下拉菜单，或修改 `main.rs` 中的 `DEFAULT_RPC_URL`。

## 项目结构

```
sol-safekey-ui/
├── src/                    # Next.js 前端源代码
│   ├── app/               # App 路由页面
│   └── components/        # React 组件
│       └── ui/            # shadcn/ui 组件
├── sol-safekey/           # sol-safekey 库（子模块）
├── main.rs                # Rust 后端入口
├── Cargo.toml             # Rust 依赖
├── package.json           # Node.js 依赖
├── build.sh               # 构建脚本
├── start.sh               # 启动脚本
└── dev.sh                 # 开发脚本
```

## 错误处理

应用包含全面的错误处理：

- 无效的私钥返回清晰的错误消息（不会导致服务器崩溃）
- 网络错误显示可操作的反馈
- 交易失败显示详细的错误描述
- 表单验证防止无效输入

## 从源码构建

如果要手动构建项目：

```bash
# 安装前端依赖
npm install

# 构建前端
npm run build

# 构建 Rust 二进制文件
cargo build --release

# 运行二进制文件
./target/release/sol-safekey-ui
```

## 故障排除

**服务器无法启动**:
- 检查端口 3001 是否已被占用: `lsof -i :3001`
- 终止现有进程: `pkill -f sol-safekey-ui`

**前端未更新**:
- 运行 `npm run build` 重新构建前端
- 运行 `cargo build --release` 重新嵌入前端
- 重启服务器

**交易失败**:
- 验证您有足够的 SOL 支付费用
- 检查 RPC 端点是否可访问
- 确保使用正确的网络（主网/测试网）

## 许可证

本项目基于 [sol-safekey](https://github.com/0xfnzero/sol-safekey) 构建，遵循其许可条款。

## 贡献

欢迎贡献！请随时提交 Pull Request。

## 致谢

- [sol-safekey](https://github.com/0xfnzero/sol-safekey) - 核心安全库
- [Next.js](https://nextjs.org/) - React 框架
- [shadcn/ui](https://ui.shadcn.com/) - UI 组件
- [Solana](https://solana.com/) - 区块链平台
- [Axum](https://github.com/tokio-rs/axum) - Rust Web 框架
