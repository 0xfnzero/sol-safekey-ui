use axum::{
    body::Body,
    extract::{Path as AxumPath, State},
    http::{StatusCode, Uri},
    response::{IntoResponse, Response},
    routing::{get, post},
    Json, Router,
};
use rust_embed::RustEmbed;
use serde::{Deserialize, Serialize};
use serde_json::json;
use std::net::SocketAddr;
use tower_http::cors::CorsLayer;
use tower_http::trace::TraceLayer;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

#[derive(RustEmbed)]
#[folder = "../out"]
struct Assets;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "sol_safekey_ui=debug,tower_http=debug".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    let app = Router::new()
        .route("/api/health", get(health))
        .route("/api/keys/create", post(create_key))
        .route("/api/keys/create-encrypted", post(create_encrypted_key))
        .route("/api/keys/decrypt", post(decrypt_key))
        .route("/api/wallet/unlock", post(unlock_wallet))
        .route("/api/wallet/balance", post(get_balance))
        .route("/api/transfer/sol", post(transfer_sol))
        .fallback(serve_assets);

    let addr = SocketAddr::from(([0, 0, 0, 0], 3001));
    let listener = tokio::net::TcpListener::bind(addr).await?;
    tracing::info!("Server listening on http://{}", addr);

    axum::serve(listener, app).await?;
    Ok(())
}

async fn health() -> Json<serde_json::Value> {
    Json(json!({
        "status": "ok",
        "service": "sol-safekey-ui",
        "version": "0.1.0"
    }))
}

#[derive(Deserialize)]
struct CreateKeyRequest {
    #[serde(default)]
    name: Option<String>,
}

#[derive(Serialize)]
struct CreateKeyResponse {
    public_key: String,
    secret_key: String,
    name: String,
}

async fn create_key(Json(req): Json<CreateKeyRequest>) -> Result<Json<CreateKeyResponse>, ApiError> {
    // 使用 sol-safekey 创建密钥
    let keypair = sol_safekey::key::create_plain_key()?;
    let public_key = keypair.public_key();
    let secret_key = keypair.secret_key();

    let name = req.name.unwrap_or_else(|| "default".to_string());

    Ok(Json(CreateKeyResponse {
        public_key: public_key.to_string(),
        secret_key: secret_key.to_string(),
        name,
    }))
}

#[derive(Deserialize)]
struct CreateEncryptedKeyRequest {
    password: String,
    #[serde(default)]
    name: Option<String>,
}

#[derive(Serialize)]
struct CreateEncryptedKeyResponse {
    public_key: String,
    encrypted_data: String,
    name: String,
}

async fn create_encrypted_key(
    Json(req): Json<CreateEncryptedKeyRequest>,
) -> Result<Json<CreateEncryptedKeyResponse>, ApiError> {
    let keypair = sol_safekey::key::create_encrypted_key(&req.password)?;
    let public_key = keypair.public_key();
    let encrypted_data = keypair.encrypted_data();

    let name = req.name.unwrap_or_else(|| "default".to_string());

    Ok(Json(CreateEncryptedKeyResponse {
        public_key: public_key.to_string(),
        encrypted_data: encrypted_data.to_string(),
        name,
    }))
}

#[derive(Deserialize)]
struct DecryptKeyRequest {
    encrypted_data: String,
    password: String,
}

#[derive(Serialize)]
struct DecryptKeyResponse {
    public_key: String,
    secret_key: String,
}

async fn decrypt_key(
    Json(req): Json<DecryptKeyRequest>,
) -> Result<Json<DecryptKeyResponse>, ApiError> {
    let keypair = sol_safekey::key::decrypt_key(&req.encrypted_data, &req.password)?;
    let public_key = keypair.public_key();
    let secret_key = keypair.secret_key();

    Ok(Json(DecryptKeyResponse {
        public_key: public_key.to_string(),
        secret_key: secret_key.to_string(),
    }))
}

#[derive(Deserialize)]
struct UnlockWalletRequest {
    key_data: String,
    password: Option<String>,
}

#[derive(Serialize)]
struct UnlockWalletResponse {
    public_key: String,
    unlocked: bool,
}

async fn unlock_wallet(
    Json(req): Json<UnlockWalletRequest>,
) -> Result<Json<UnlockWalletResponse>, ApiError> {
    let wallet = if let Some(password) = req.password {
        sol_safekey::wallet::unlock_encrypted(&req.key_data, &password)?
    } else {
        sol_safekey::wallet::unlock_plain(&req.key_data)?
    };

    let public_key = wallet.public_key();

    Ok(Json(UnlockWalletResponse {
        public_key: public_key.to_string(),
        unlocked: true,
    }))
}

#[derive(Deserialize)]
struct GetBalanceRequest {
    pub key: String,
}

#[derive(Serialize)]
struct GetBalanceResponse {
    balance: f64,
    address: String,
}

async fn get_balance(
    Json(req): Json<GetBalanceRequest>,
) -> Result<Json<GetBalanceResponse>, ApiError> {
    let balance = sol_safekey::operations::get_balance(&req.key)?;

    Ok(Json(GetBalanceResponse {
        balance: balance / 1_000_000_000.0, // Convert lamports to SOL
        address: req.key,
    }))
}

#[derive(Deserialize)]
struct TransferSolRequest {
    from_key: String,
    to_address: String,
    amount: f64,
}

#[derive(Serialize)]
struct TransferSolResponse {
    signature: String,
    status: String,
}

async fn transfer_sol(
    Json(req): Json<TransferSolRequest>,
) -> Result<Json<TransferSolResponse>, ApiError> {
    let amount_lamports = (req.amount * 1_000_000_000.0) as u64;
    let signature = sol_safekey::operations::transfer_sol(&req.from_key, &req.to_address, amount_lamports)?;

    Ok(Json(TransferSolResponse {
        signature: signature.to_string(),
        status: "success".to_string(),
    }))
}

// Serve embedded static files
async fn serve_assets(uri: Uri) -> impl IntoResponse {
    let path = uri.path();

    // Default to index.html for root path
    let path_to_serve = if path == "/" {
        "index.html"
    } else {
        &path[1..] // Remove leading slash
    };

    // Try to get the file from embedded assets
    match Assets::get(path_to_serve) {
        Some(content) => {
            let mime = mime_guess::from_path(path_to_serve)
                .first_or_octet_stream()
                .to_string();

            Response::builder()
                .status(StatusCode::OK)
                .header("Content-Type", mime)
                .body(Body::from(content.data.to_vec()))
                .unwrap()
        }
        None => {
            // If file not found, serve index.html (for SPA routing)
            if let Some(index) = Assets::get("index.html") {
                Response::builder()
                    .status(StatusCode::OK)
                    .header("Content-Type", "text/html")
                    .body(Body::from(index.data.to_vec()))
                    .unwrap()
            } else {
                Response::builder()
                    .status(StatusCode::NOT_FOUND)
                    .body(Body::from("Not Found"))
                    .unwrap()
            }
        }
    }
}

#[derive(Debug)]
struct ApiError {
    message: String,
}

impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        let body = Json(json!({
            "error": self.message
        }));
        (StatusCode::INTERNAL_SERVER_ERROR, body).into_response()
    }
}

impl From<anyhow::Error> for ApiError {
    fn from(err: anyhow::Error) -> Self {
        ApiError {
            message: err.to_string(),
        }
    }
}
