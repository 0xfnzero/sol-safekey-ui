use axum::{body::Body, http::{StatusCode, Uri}, response::{IntoResponse, Response}, routing::{get, post}, Json, Router};
use tower_http::cors::{Any, CorsLayer};
use rust_embed::RustEmbed;
use serde::{Deserialize, Serialize};
use serde_json::json;
use solana_sdk::pubkey::Pubkey;
use solana_sdk::signature::Keypair;
use solana_sdk::signature::Signer;
use std::net::SocketAddr;
use std::str::FromStr;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};
use sol_safekey::KeyManager;
use sol_safekey::solana_utils::{SolanaClient, lamports_to_sol};
use sol_safekey::operations::Language;

// Helper function to safely create keypair from base58 string
fn keypair_from_base58_safe(private_key: &str) -> Result<Keypair, String> {
    Keypair::try_from_base58_string(private_key)
        .map_err(|e| format!("无效的私钥格式: {}", e))
}

#[derive(RustEmbed)]
#[folder = "out"]
struct Assets;

const DEFAULT_RPC_URL: &str = "https://api.mainnet-beta.solana.com";
const DEVNET_RPC_URL: &str = "https://api.devnet.solana.com";

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tracing_subscriber::registry()
        .with(tracing_subscriber::EnvFilter::try_from_default_env().unwrap_or_else(|_| "sol_safekey_ui=info".into()))
        .with(tracing_subscriber::fmt::layer())
        .init();

    let app = Router::new()
        // Health
        .route("/api/health", get(health))
        // Core Functions (1-3)
        .route("/api/keys/create", post(create_key))
        .route("/api/keys/encrypt", post(encrypt_key))
        .route("/api/keys/decrypt", post(decrypt_key))
        .route("/api/keys/create-keystore", post(create_keystore))
        .route("/api/keys/import-keystore", post(import_keystore))
        // Wallet Management (U, 7)
        .route("/api/wallet/balance", post(get_balance))
        .route("/api/wallet/unlock", post(unlock_wallet))
        .route("/api/wallet/get-pubkey", post(get_pubkey))
        // SOL Operations (8)
        .route("/api/transfer/sol", post(transfer_sol))
        // WSOL Operations (9-12)
        .route("/api/wsol/create-ata", post(create_wsol_ata))
        .route("/api/wsol/wrap", post(wrap_sol))
        .route("/api/wsol/unwrap", post(unwrap_sol))
        .route("/api/wsol/close-ata", post(close_wsol_ata))
        // 2FA Operations (4-6)
        .route("/api/2fa/setup", post(setup_2fa))
        .route("/api/2fa/create-tfa", post(create_triple_factor_wallet))
        .route("/api/2fa/unlock-tfa", post(unlock_triple_factor_wallet))
        // Pump.fun Operations (15-18)
        .route("/api/pumpfun/sell", post(pumpfun_sell))
        .route("/api/pumpfun/cashback", post(pumpfun_cashback))
        .route("/api/pumpswap/sell", post(pumpswap_sell))
        .route("/api/pumpswap/cashback", post(pumpswap_cashback))
        // Token Operations (13)
        .route("/api/transfer/token", post(transfer_token))
        // Nonce Operations (14)
        .route("/api/nonce/create", post(create_nonce_account))
        .fallback(serve_assets)
        .layer(
            CorsLayer::new()
                .allow_origin(Any)
                .allow_methods(Any)
                .allow_headers(Any),
        );

    const DEFAULT_PORT: u16 = 3841;
    let port: u16 = std::env::var("PORT")
        .ok()
        .and_then(|s| s.parse().ok())
        .unwrap_or(DEFAULT_PORT);
    let addr = SocketAddr::from(([0, 0, 0, 0], port));
    let listener = tokio::net::TcpListener::bind(addr).await?;
    tracing::info!("Server listening on http://{}", addr);
    axum::serve(listener, app).await?;
    Ok(())
}

async fn health() -> Json<serde_json::Value> {
    Json(json!({
        "status": "ok",
        "service": "sol-safekey-ui",
        "version": "0.5.0",
        "features": ["keys", "wallet", "transfer", "wsol", "token", "nonce"]
    }))
}

// ============= Helper Functions =============

fn get_rpc_url(network: Option<&str>) -> &'static str {
    match network {
        Some("devnet") => DEVNET_RPC_URL,
        _ => DEFAULT_RPC_URL,
    }
}

// ============= Core Functions (1-3) =============

// 1. Create Plaintext Key
#[derive(Deserialize)] struct CreateKeyRequest { #[serde(default)] name: Option<String> }
#[derive(Serialize)] struct CreateKeyResponse { public_key: String, secret_key: String, name: String }

async fn create_key(Json(req): Json<CreateKeyRequest>) -> Result<Json<CreateKeyResponse>, ApiError> {
    let keypair = KeyManager::generate_keypair();
    Ok(Json(CreateKeyResponse {
        public_key: keypair.pubkey().to_string(),
        secret_key: keypair.to_base58_string(),
        name: req.name.unwrap_or_else(|| "default".to_string()),
    }))
}

// 2. Create Encrypted Key / Encrypt Key
#[derive(Deserialize)] struct EncryptKeyRequest { secret_key: String, password: String }
#[derive(Serialize)] struct EncryptKeyResponse { encrypted_key: String }

async fn encrypt_key(Json(req): Json<EncryptKeyRequest>) -> Result<Json<EncryptKeyResponse>, ApiError> {
    let encrypted = KeyManager::encrypt_with_password(&req.secret_key, &req.password)
        .map_err(|e| ApiError { message: e })?;
    Ok(Json(EncryptKeyResponse { encrypted_key: encrypted }))
}

// 3. Decrypt Key
#[derive(Deserialize)] struct DecryptKeyRequest { encrypted_key: String, password: String }
#[derive(Serialize)] struct DecryptKeyResponse { secret_key: String }

async fn decrypt_key(Json(req): Json<DecryptKeyRequest>) -> Result<Json<DecryptKeyResponse>, ApiError> {
    let decrypted = KeyManager::decrypt_with_password(&req.encrypted_key, &req.password)
        .map_err(|e| ApiError { message: e })?;
    Ok(Json(DecryptKeyResponse { secret_key: decrypted }))
}

// Create Keystore
#[derive(Deserialize)] struct CreateKeystoreRequest { password: String }
#[derive(Serialize)] struct CreateKeystoreResponse { keystore_json: String, public_key: String }

async fn create_keystore(Json(req): Json<CreateKeystoreRequest>) -> Result<Json<CreateKeystoreResponse>, ApiError> {
    let keypair = KeyManager::generate_keypair();
    let keystore_json = KeyManager::keypair_to_encrypted_json(&keypair, &req.password)
        .map_err(|e| ApiError { message: e })?;
    Ok(Json(CreateKeystoreResponse {
        keystore_json,
        public_key: keypair.pubkey().to_string(),
    }))
}

// Import Keystore
#[derive(Deserialize)] struct ImportKeystoreRequest { keystore_json: String, password: String }
#[derive(Serialize)] struct ImportKeystoreResponse { public_key: String, secret_key: String }

async fn import_keystore(Json(req): Json<ImportKeystoreRequest>) -> Result<Json<ImportKeystoreResponse>, ApiError> {
    let keypair = KeyManager::keypair_from_encrypted_json(&req.keystore_json, &req.password)
        .map_err(|e| ApiError { message: e })?;
    Ok(Json(ImportKeystoreResponse {
        public_key: keypair.pubkey().to_string(),
        secret_key: keypair.to_base58_string(),
    }))
}

// ============= Wallet Management (U, 7) =============

// U. Unlock Wallet (same as import_keystore)
#[derive(Deserialize)] struct UnlockWalletRequest { keystore_json: String, password: String }
#[derive(Serialize)] struct UnlockWalletResponse { public_key: String, secret_key: String }

async fn unlock_wallet(Json(req): Json<UnlockWalletRequest>) -> Result<Json<UnlockWalletResponse>, ApiError> {
    let keypair = KeyManager::keypair_from_encrypted_json(&req.keystore_json, &req.password)
        .map_err(|e| ApiError { message: e })?;
    Ok(Json(UnlockWalletResponse {
        public_key: keypair.pubkey().to_string(),
        secret_key: keypair.to_base58_string(),
    }))
}

// 7. Check SOL Balance
#[derive(Deserialize)] struct GetBalanceRequest { address: String, #[serde(default)] network: Option<String> }
#[derive(Serialize)] struct GetBalanceResponse { balance: f64, address: String, network: String }

async fn get_balance(Json(req): Json<GetBalanceRequest>) -> Result<Json<GetBalanceResponse>, ApiError> {
    let pubkey = Pubkey::from_str(&req.address).map_err(|_| ApiError { message: "无效的地址".to_string() })?;
    let rpc_url = get_rpc_url(req.network.as_deref());
    let client = SolanaClient::new(rpc_url.to_string());
    let balance = client.get_sol_balance(&pubkey).map_err(|e| ApiError { message: format!("查询失败: {}", e) })?;

    Ok(Json(GetBalanceResponse {
        balance: lamports_to_sol(balance),
        address: req.address,
        network: if req.network.as_deref() == Some("devnet") { "devnet".to_string() } else { "mainnet".to_string() },
    }))
}

// Get Public Key from Secret Key
#[derive(Deserialize)] struct GetPubkeyRequest {
    #[serde(default)]
    secret_key: Option<String>,
    #[serde(default)]
    encrypted_key: Option<String>,
    #[serde(default)]
    keystore_json: Option<String>,
    #[serde(default)]
    password: Option<String>,
}
#[derive(Serialize)] struct GetPubkeyResponse { public_key: String }

async fn get_pubkey(Json(req): Json<GetPubkeyRequest>) -> Result<Json<GetPubkeyResponse>, ApiError> {
    let secret_key = if let Some(encrypted) = req.encrypted_key {
        let password = req.password.ok_or_else(|| ApiError { message: "使用加密私钥时需要提供密码".to_string() })?;
        KeyManager::decrypt_with_password(&encrypted, &password)
            .map_err(|e| ApiError { message: format!("解密失败: {}", e) })?
    } else if let Some(keystore) = req.keystore_json {
        let password = req.password.ok_or_else(|| ApiError { message: "使用 keystore 时需要提供密码".to_string() })?;
        let keypair = KeyManager::keypair_from_encrypted_json(&keystore, &password)
            .map_err(|e| ApiError { message: format!("keystore 解密失败: {}", e) })?;
        keypair.to_base58_string()
    } else {
        req.secret_key.ok_or_else(|| ApiError { message: "需要提供私钥、加密私钥或 keystore".to_string() })?
    };

    let pubkey = KeyManager::get_public_key(&secret_key).map_err(|e| ApiError { message: e })?;
    Ok(Json(GetPubkeyResponse { public_key: pubkey }))
}

// ============= SOL Operations (8) =============

// 8. Transfer SOL
#[derive(Deserialize)] struct TransferSolRequest {
    #[serde(default)]
    private_key: Option<String>,
    #[serde(default)]
    keystore_json: Option<String>,
    #[serde(default)]
    password: Option<String>,
    to_address: String,
    amount: f64,
    #[serde(default)] network: Option<String>,
}
#[derive(Serialize)] struct TransferSolResponse { signature: String, status: String }

async fn transfer_sol(Json(req): Json<TransferSolRequest>) -> Result<Json<TransferSolResponse>, ApiError> {
    let to_pubkey = Pubkey::from_str(&req.to_address).map_err(|_| ApiError { message: "无效的接收地址".to_string() })?;

    // Get keypair from either private_key or keystore+password
    let keypair = if let Some(json) = req.keystore_json {
        let password = req.password.ok_or_else(|| ApiError { message: "使用 keystore 时需要提供密码".to_string() })?;
        KeyManager::keypair_from_encrypted_json(&json, &password)
            .map_err(|e| ApiError { message: format!("keystore 解密失败: {}", e) })?
    } else {
        let private_key = req.private_key.ok_or_else(|| ApiError { message: "需要提供私钥或 keystore".to_string() })?;
        keypair_from_base58_safe(&private_key).map_err(|e| ApiError { message: e })?
    };

    let amount_lamports = (req.amount * 1_000_000_000.0) as u64;
    let rpc_url = get_rpc_url(req.network.as_deref());
    let client = SolanaClient::new(rpc_url.to_string());

    let signature = client.transfer_sol(&keypair, &to_pubkey, amount_lamports)
        .map_err(|e| ApiError { message: format!("转账失败: {}", e) })?;

    Ok(Json(TransferSolResponse {
        signature: signature.to_string(),
        status: "success".to_string()
    }))
}

// ============= WSOL Operations (9-11) =============

// 9. Create WSOL ATA
#[derive(Deserialize)] struct CreateWsolAtaRequest {
    #[serde(default)]
    private_key: Option<String>,
    #[serde(default)]
    keystore_json: Option<String>,
    #[serde(default)]
    password: Option<String>,
    #[serde(default)] network: Option<String>,
}
#[derive(Serialize)] struct CreateWsolAtaResponse { signature: String, status: String }

async fn create_wsol_ata(Json(req): Json<CreateWsolAtaRequest>) -> Result<Json<CreateWsolAtaResponse>, ApiError> {
    // Get keypair from either private_key or keystore+password
    let keypair = if let Some(json) = req.keystore_json {
        let password = req.password.ok_or_else(|| ApiError { message: "使用 keystore 时需要提供密码".to_string() })?;
        KeyManager::keypair_from_encrypted_json(&json, &password)
            .map_err(|e| ApiError { message: format!("keystore 解密失败: {}", e) })?
    } else {
        let private_key = req.private_key.ok_or_else(|| ApiError { message: "需要提供私钥或 keystore".to_string() })?;
        keypair_from_base58_safe(&private_key).map_err(|e| ApiError { message: e })?
    };

    let rpc_url = get_rpc_url(req.network.as_deref());

    // Use tokio runtime to run async function
    let signature = tokio::task::spawn_blocking(move || {
        let rt = tokio::runtime::Runtime::new().unwrap();

        rt.block_on(async {
            let sdk_client = sol_safekey::solana_utils::SolanaClientSdk::new(rpc_url.to_string(), false);
            sdk_client.create_wsol_ata(&keypair).await
        })
    }).await.map_err(|e| ApiError { message: format!("创建失败: {}", e) })?
        .map_err(|e| ApiError { message: format!("创建失败: {}", e) })?;

    Ok(Json(CreateWsolAtaResponse {
        signature: signature.to_string(),
        status: "success".to_string()
    }))
}

// 10. Wrap SOL
#[derive(Deserialize)] struct WrapSolRequest {
    #[serde(default)]
    private_key: Option<String>,
    #[serde(default)]
    keystore_json: Option<String>,
    #[serde(default)]
    password: Option<String>,
    amount: f64,
    #[serde(default)] network: Option<String>,
}
#[derive(Serialize)] struct WrapSolResponse { signature: String, status: String }

async fn wrap_sol(Json(req): Json<WrapSolRequest>) -> Result<Json<WrapSolResponse>, ApiError> {
    // Get keypair from either private_key or keystore+password
    let keypair = if let Some(json) = req.keystore_json {
        let password = req.password.ok_or_else(|| ApiError { message: "使用 keystore 时需要提供密码".to_string() })?;
        KeyManager::keypair_from_encrypted_json(&json, &password)
            .map_err(|e| ApiError { message: format!("keystore 解密失败: {}", e) })?
    } else {
        let private_key = req.private_key.ok_or_else(|| ApiError { message: "需要提供私钥或 keystore".to_string() })?;
        keypair_from_base58_safe(&private_key).map_err(|e| ApiError { message: e })?
    };

    let amount_lamports = (req.amount * 1_000_000_000.0) as u64;
    let rpc_url = get_rpc_url(req.network.as_deref());
    let client = SolanaClient::new(rpc_url.to_string());

    let signature = client.wrap_sol(&keypair, amount_lamports)
        .map_err(|e| ApiError { message: format!("封装失败: {}", e) })?;

    Ok(Json(WrapSolResponse {
        signature: signature.to_string(),
        status: "success".to_string()
    }))
}

// 11. Unwrap SOL
#[derive(Deserialize)] struct UnwrapSolRequest {
    #[serde(default)]
    private_key: Option<String>,
    #[serde(default)]
    keystore_json: Option<String>,
    #[serde(default)]
    password: Option<String>,
    #[serde(default)] network: Option<String>,
}
#[derive(Serialize)] struct UnwrapSolResponse { signature: String, status: String }

async fn unwrap_sol(Json(req): Json<UnwrapSolRequest>) -> Result<Json<UnwrapSolResponse>, ApiError> {
    // Get keypair from either private_key or keystore+password
    let keypair = if let Some(json) = req.keystore_json {
        let password = req.password.ok_or_else(|| ApiError { message: "使用 keystore 时需要提供密码".to_string() })?;
        KeyManager::keypair_from_encrypted_json(&json, &password)
            .map_err(|e| ApiError { message: format!("keystore 解密失败: {}", e) })?
    } else {
        let private_key = req.private_key.ok_or_else(|| ApiError { message: "需要提供私钥或 keystore".to_string() })?;
        keypair_from_base58_safe(&private_key).map_err(|e| ApiError { message: e })?
    };

    let rpc_url = get_rpc_url(req.network.as_deref());
    let client = SolanaClient::new(rpc_url.to_string());

    let signature = client.unwrap_sol(&keypair)
        .map_err(|e| ApiError { message: format!("解封失败: {}", e) })?;

    Ok(Json(UnwrapSolResponse {
        signature: signature.to_string(),
        status: "success".to_string()
    }))
}

// 12. Close WSOL ATA
#[derive(Deserialize)] struct CloseWsolAtaRequest {
    #[serde(default)]
    private_key: Option<String>,
    #[serde(default)]
    keystore_json: Option<String>,
    #[serde(default)]
    password: Option<String>,
    #[serde(default)] network: Option<String>,
}
#[derive(Serialize)] struct CloseWsolAtaResponse { signature: String, status: String }

async fn close_wsol_ata(Json(req): Json<CloseWsolAtaRequest>) -> Result<Json<CloseWsolAtaResponse>, ApiError> {
    // Get keypair from either private_key or keystore+password
    let keypair = if let Some(json) = req.keystore_json {
        let password = req.password.ok_or_else(|| ApiError { message: "使用 keystore 时需要提供密码".to_string() })?;
        KeyManager::keypair_from_encrypted_json(&json, &password)
            .map_err(|e| ApiError { message: format!("keystore 解密失败: {}", e) })?
    } else {
        let private_key = req.private_key.ok_or_else(|| ApiError { message: "需要提供私钥或 keystore".to_string() })?;
        keypair_from_base58_safe(&private_key).map_err(|e| ApiError { message: e })?
    };

    let rpc_url = get_rpc_url(req.network.as_deref());
    let client = SolanaClient::new(rpc_url.to_string());

    // Close WSOL ATA by unwrapping all WSOL
    let signature = client.unwrap_sol(&keypair)
        .map_err(|e| ApiError { message: format!("关闭 ATA 失败: {}", e) })?;

    Ok(Json(CloseWsolAtaResponse {
        signature: signature.to_string(),
        status: "success".to_string()
    }))
}

// ============= Token Operations (13) =============

// 13. Transfer SPL Token
#[derive(Deserialize)] struct TransferTokenRequest {
    #[serde(default)]
    private_key: Option<String>,
    #[serde(default)]
    keystore_json: Option<String>,
    #[serde(default)]
    password: Option<String>,
    to_address: String,
    mint: String,
    amount: f64,
    decimals: u8,
    #[serde(default)] network: Option<String>,
}
#[derive(Serialize)] struct TransferTokenResponse { signature: String, status: String }

async fn transfer_token(Json(req): Json<TransferTokenRequest>) -> Result<Json<TransferTokenResponse>, ApiError> {
    let to_pubkey = Pubkey::from_str(&req.to_address).map_err(|_| ApiError { message: "无效的接收地址".to_string() })?;
    let mint = Pubkey::from_str(&req.mint).map_err(|_| ApiError { message: "无效的mint地址".to_string() })?;

    // Get keypair from either private_key or keystore+password
    let keypair = if let Some(json) = req.keystore_json {
        let password = req.password.ok_or_else(|| ApiError { message: "使用 keystore 时需要提供密码".to_string() })?;
        KeyManager::keypair_from_encrypted_json(&json, &password)
            .map_err(|e| ApiError { message: format!("keystore 解密失败: {}", e) })?
    } else {
        let private_key = req.private_key.ok_or_else(|| ApiError { message: "需要提供私钥或 keystore".to_string() })?;
        keypair_from_base58_safe(&private_key).map_err(|e| ApiError { message: e })?
    };

    let rpc_url = get_rpc_url(req.network.as_deref());
    let client = SolanaClient::new(rpc_url.to_string());

    // Convert amount to token units
    let token_amount = (req.amount * (10_f64.powi(req.decimals as i32))) as u64;

    let signature = client.transfer_token(&keypair, &to_pubkey, &mint, token_amount)
        .map_err(|e| ApiError { message: format!("转账失败: {}", e) })?;

    Ok(Json(TransferTokenResponse {
        signature: signature.to_string(),
        status: "success".to_string()
    }))
}

// ============= Nonce Operations (14) =============

// 14. Create Nonce Account
#[derive(Deserialize)] struct CreateNonceAccountRequest {
    #[serde(default)]
    private_key: Option<String>,
    #[serde(default)]
    keystore_json: Option<String>,
    #[serde(default)]
    password: Option<String>,
    #[serde(default)] network: Option<String>,
}
#[derive(Serialize)] struct CreateNonceAccountResponse { nonce_account: String, signature: String, status: String }

async fn create_nonce_account(Json(req): Json<CreateNonceAccountRequest>) -> Result<Json<CreateNonceAccountResponse>, ApiError> {
    // Get keypair from either private_key or keystore+password
    let keypair = if let Some(json) = req.keystore_json {
        let password = req.password.ok_or_else(|| ApiError { message: "使用 keystore 时需要提供密码".to_string() })?;
        KeyManager::keypair_from_encrypted_json(&json, &password)
            .map_err(|e| ApiError { message: format!("keystore 解密失败: {}", e) })?
    } else {
        let private_key = req.private_key.ok_or_else(|| ApiError { message: "需要提供私钥或 keystore".to_string() })?;
        keypair_from_base58_safe(&private_key).map_err(|e| ApiError { message: e })?
    };

    let rpc_url = get_rpc_url(req.network.as_deref());
    let client = SolanaClient::new(rpc_url.to_string());

    let (nonce_account, signature) = client.create_nonce_account(&keypair)
        .map_err(|e| ApiError { message: format!("创建失败: {}", e) })?;

    Ok(Json(CreateNonceAccountResponse {
        nonce_account: nonce_account.to_string(),
        signature: signature.to_string(),
        status: "success".to_string()
    }))
}

// ============= 2FA Operations (4-6) =============

// 4. Setup 2FA
#[derive(Deserialize)] struct Setup2faRequest {
    hardware_fingerprint: String,
    master_password: String,
    #[serde(default)] account: Option<String>,
    #[serde(default)] issuer: Option<String>,
}
#[derive(Serialize)] struct Setup2faResponse { totp_secret: String, qr_code_url: String }

async fn setup_2fa(Json(req): Json<Setup2faRequest>) -> Result<Json<Setup2faResponse>, ApiError> {
    let account = req.account.unwrap_or_else(|| "sol-safekey".to_string());
    let issuer = req.issuer.unwrap_or_else(|| "Sol SafeKey".to_string());

    let totp_secret = sol_safekey::derive_totp_secret_from_hardware_and_password(
        &req.hardware_fingerprint,
        &req.master_password,
        &account,
        &issuer,
    ).map_err(|e| ApiError { message: format!("生成 TOTP 失败: {}", e) })?;

    // Generate QR code URL
    let qr_code_url = format!("otpauth://totp/{}:{}?secret={}&issuer={}",
        issuer, account, totp_secret, issuer);

    Ok(Json(Setup2faResponse {
        totp_secret,
        qr_code_url,
    }))
}

// 5. Create Triple-Factor Wallet
#[derive(Deserialize)] struct CreateTripleFactorRequest {
    private_key: String,
    totp_secret: String,
    hardware_fingerprint: String,
    master_password: String,
    question_index: usize,
    security_answer: String,
}
#[derive(Serialize)] struct CreateTripleFactorResponse { encrypted_wallet: String, public_key: String }

async fn create_triple_factor_wallet(Json(req): Json<CreateTripleFactorRequest>) -> Result<Json<CreateTripleFactorResponse>, ApiError> {
    let encrypted = sol_safekey::encrypt_with_triple_factor(
        &req.private_key,
        &req.totp_secret,
        &req.hardware_fingerprint,
        &req.master_password,
        req.question_index,
        &req.security_answer,
    ).map_err(|e| ApiError { message: format!("加密失败: {}", e) })?;

    // Get public key from private key
    let public_key = KeyManager::get_public_key(&req.private_key)
        .map_err(|e| ApiError { message: format!("获取公钥失败: {}", e) })?;

    Ok(Json(CreateTripleFactorResponse {
        encrypted_wallet: encrypted,
        public_key,
    }))
}

// 6. Unlock Triple-Factor Wallet
#[derive(Deserialize)] struct UnlockTripleFactorRequest {
    encrypted_wallet: String,
    hardware_fingerprint: String,
    master_password: String,
    security_answer: String,
    totp_code: String,
}
#[derive(Serialize)] struct UnlockTripleFactorResponse { private_key: String, public_key: String }

async fn unlock_triple_factor_wallet(Json(req): Json<UnlockTripleFactorRequest>) -> Result<Json<UnlockTripleFactorResponse>, ApiError> {
    let (decrypted, _question, _index) = sol_safekey::decrypt_with_triple_factor_and_2fa(
        &req.encrypted_wallet,
        &req.hardware_fingerprint,
        &req.master_password,
        &req.security_answer,
        &req.totp_code,
    ).map_err(|e| ApiError { message: format!("解密失败: {}", e) })?;

    let public_key = KeyManager::get_public_key(&decrypted)
        .map_err(|e| ApiError { message: format!("获取公钥失败: {}", e) })?;

    Ok(Json(UnlockTripleFactorResponse {
        private_key: decrypted,
        public_key,
    }))
}

// ============= Pump.fun Operations (15-18) =============

// 15. Pump.fun Sell Token
#[derive(Deserialize)] struct PumpfunSellRequest {
    #[serde(default)]
    private_key: Option<String>,
    #[serde(default)]
    keystore_json: Option<String>,
    #[serde(default)]
    password: Option<String>,
    mint: String,
    /// Accepted from API clients; pump sell path uses mint + slippage (amount reserved for future use).
    #[allow(dead_code)]
    amount: f64,
    #[serde(default)] slippage: Option<u64>,
    #[serde(default)] network: Option<String>,
}
#[derive(Serialize)] struct PumpfunSellResponse { status: String }

async fn pumpfun_sell(Json(req): Json<PumpfunSellRequest>) -> Result<Json<PumpfunSellResponse>, ApiError> {
    let keypair = if let Some(json) = req.keystore_json {
        let password = req.password.ok_or_else(|| ApiError { message: "使用 keystore 时需要提供密码".to_string() })?;
        KeyManager::keypair_from_encrypted_json(&json, &password)
            .map_err(|e| ApiError { message: format!("keystore 解密失败: {}", e) })?
    } else {
        let private_key = req.private_key.ok_or_else(|| ApiError { message: "需要提供私钥或 keystore".to_string() })?;
        Keypair::from_base58_string(&private_key)
    };

    let rpc_url = get_rpc_url(req.network.as_deref());
    let slippage = req.slippage.unwrap_or(100); // Default 1% slippage

    // Use tokio runtime to run async function
    tokio::task::spawn_blocking(move || {
        let rt = tokio::runtime::Runtime::new().unwrap();
        rt.block_on(async {
            sol_safekey::solana_utils::pumpfun_sell::handle_pumpfun_sell_no_prompt(
                &keypair,
                &req.mint,
                rpc_url,
                slippage,
                false, // use_seed
                Language::English,
                true,  // skip_confirmation
            ).await
        })
    }).await.map_err(|e| ApiError { message: format!("卖出失败: {}", e) })?
        .map_err(|e| ApiError { message: format!("卖出失败: {}", e) })?;

    Ok(Json(PumpfunSellResponse {
        status: "success".to_string()
    }))
}

// 17. Pump.fun Cashback
#[derive(Deserialize)] struct PumpfunCashbackRequest {
    #[serde(default)]
    private_key: Option<String>,
    #[serde(default)]
    keystore_json: Option<String>,
    #[serde(default)]
    password: Option<String>,
    /// Reserved for RPC selection when cashback is implemented server-side.
    #[allow(dead_code)]
    #[serde(default)]
    network: Option<String>,
}
#[derive(Serialize)] struct PumpfunCashbackResponse { status: String, message: String }

async fn pumpfun_cashback(Json(req): Json<PumpfunCashbackRequest>) -> Result<Json<PumpfunCashbackResponse>, ApiError> {
    let _keypair = if let Some(json) = req.keystore_json {
        let password = req.password.ok_or_else(|| ApiError { message: "使用 keystore 时需要提供密码".to_string() })?;
        KeyManager::keypair_from_encrypted_json(&json, &password)
            .map_err(|e| ApiError { message: format!("keystore 解密失败: {}", e) })?
    } else {
        let private_key = req.private_key.ok_or_else(|| ApiError { message: "需要提供私钥或 keystore".to_string() })?;
        keypair_from_base58_safe(&private_key).map_err(|e| ApiError { message: e })?
    };

    // Cashback functionality is complex and requires interactive CLI
    // For now, return a message directing users to use the CLI
    Ok(Json(PumpfunCashbackResponse {
        status: "info".to_string(),
        message: "Pump.fun Cashback 功能需要使用 CLI 版本的 sol-safekey。请使用命令行工具: sol-safekey pumpfun-cashback".to_string(),
    }))
}

// 16. PumpSwap Sell Token
#[derive(Deserialize)] struct PumpswapSellRequest {
    #[serde(default)]
    private_key: Option<String>,
    #[serde(default)]
    keystore_json: Option<String>,
    #[serde(default)]
    password: Option<String>,
    mint: String,
    /// Accepted from API clients; sell path uses mint + slippage (amount reserved for future use).
    #[allow(dead_code)]
    amount: f64,
    #[serde(default)] slippage: Option<u64>,
    #[serde(default)] network: Option<String>,
}
#[derive(Serialize)] struct PumpswapSellResponse { status: String }

async fn pumpswap_sell(Json(req): Json<PumpswapSellRequest>) -> Result<Json<PumpswapSellResponse>, ApiError> {
    let keypair = if let Some(json) = req.keystore_json {
        let password = req.password.ok_or_else(|| ApiError { message: "使用 keystore 时需要提供密码".to_string() })?;
        KeyManager::keypair_from_encrypted_json(&json, &password)
            .map_err(|e| ApiError { message: format!("keystore 解密失败: {}", e) })?
    } else {
        let private_key = req.private_key.ok_or_else(|| ApiError { message: "需要提供私钥或 keystore".to_string() })?;
        Keypair::from_base58_string(&private_key)
    };

    let rpc_url = get_rpc_url(req.network.as_deref());
    let slippage = req.slippage.unwrap_or(100); // Default 1% slippage

    // Use tokio runtime to run async function
    tokio::task::spawn_blocking(move || {
        let rt = tokio::runtime::Runtime::new().unwrap();
        rt.block_on(async {
            sol_safekey::solana_utils::pumpswap_sell::handle_pumpswap_sell_no_prompt(
                &keypair,
                &req.mint,
                rpc_url,
                slippage,
                false, // use_seed
                Language::English,
                true,  // skip_confirmation
            ).await
        })
    }).await.map_err(|e| ApiError { message: format!("卖出失败: {}", e) })?
        .map_err(|e| ApiError { message: format!("卖出失败: {}", e) })?;

    Ok(Json(PumpswapSellResponse {
        status: "success".to_string()
    }))
}

// 18. PumpSwap Cashback
#[derive(Deserialize)] struct PumpswapCashbackRequest {
    #[serde(default)]
    private_key: Option<String>,
    #[serde(default)]
    keystore_json: Option<String>,
    #[serde(default)]
    password: Option<String>,
    /// Reserved for RPC selection when cashback is implemented server-side.
    #[allow(dead_code)]
    #[serde(default)]
    network: Option<String>,
}
#[derive(Serialize)] struct PumpswapCashbackResponse { status: String, message: String }

async fn pumpswap_cashback(Json(req): Json<PumpswapCashbackRequest>) -> Result<Json<PumpswapCashbackResponse>, ApiError> {
    let _keypair = if let Some(json) = req.keystore_json {
        let password = req.password.ok_or_else(|| ApiError { message: "使用 keystore 时需要提供密码".to_string() })?;
        KeyManager::keypair_from_encrypted_json(&json, &password)
            .map_err(|e| ApiError { message: format!("keystore 解密失败: {}", e) })?
    } else {
        let private_key = req.private_key.ok_or_else(|| ApiError { message: "需要提供私钥或 keystore".to_string() })?;
        Keypair::from_base58_string(&private_key)
    };

    // Cashback functionality is complex and requires interactive CLI
    // For now, return a message directing users to use the CLI
    Ok(Json(PumpswapCashbackResponse {
        status: "info".to_string(),
        message: "PumpSwap Cashback 功能需要使用 CLI 版本的 sol-safekey。请使用命令行工具: sol-safekey pumpswap-cashback".to_string(),
    }))
}

// ============= Static File Serving =============

async fn serve_assets(uri: Uri) -> impl IntoResponse {
    let path = uri.path();
    tracing::info!("Serving asset: {}", path);
    
    // URL decode the path to handle encoded characters like %5B -> [ and %5D -> ]
    let decoded_path = match urlencoding::decode(path) {
        Ok(decoded) => decoded.to_string(),
        Err(e) => {
            tracing::warn!("Failed to decode path: {}, error: {}", path, e);
            path.to_string()
        }
    };
    
    let path_to_serve = if decoded_path == "/" { 
        "index.html".to_string() 
    } else { 
        decoded_path.trim_start_matches('/').to_string() 
    };
    
    tracing::info!("Looking for asset: {}", path_to_serve);
    
    match Assets::get(&path_to_serve) {
        Some(content) => {
            let mime = mime_guess::from_path(&path_to_serve).first_or_octet_stream().to_string();
            tracing::info!("Found asset: {}, mime: {}", path_to_serve, mime);
            Response::builder().status(StatusCode::OK).header("Content-Type", mime).body(Body::from(content.data.to_vec())).unwrap()
        }
        None => {
            tracing::warn!("Asset not found: {}, falling back to index.html", path_to_serve);
            if let Some(index) = Assets::get("index.html") {
                Response::builder().status(StatusCode::OK).header("Content-Type", "text/html").body(Body::from(index.data.to_vec())).unwrap()
            } else {
                Response::builder().status(StatusCode::NOT_FOUND).body(Body::from("Not Found")).unwrap()
            }
        }
    }
}

#[derive(Debug)] struct ApiError { message: String }
impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        let body = Json(json!({ "error": self.message }));
        (StatusCode::INTERNAL_SERVER_ERROR, body).into_response()
    }
}
impl From<anyhow::Error> for ApiError {
    fn from(err: anyhow::Error) -> Self {
        ApiError { message: err.to_string() }
    }
}
