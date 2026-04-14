use serde::Serialize;

/// Must match `DEFAULT_API_PORT` in `src/lib/api.ts`
const SOL_SAFEKEY_API_PORT: u16 = 3841;

#[derive(Serialize)]
struct ProxyResponse {
  status: u16,
  body: String,
}

/// HTTP from Rust → avoids WKWebView `fetch` URL issues with localhost /api.
#[tauri::command]
async fn proxy_api_request(
  method: String,
  path: String,
  body: Option<String>,
) -> Result<ProxyResponse, String> {
  let path = path.trim_start_matches('/');
  let url = format!(
    "http://127.0.0.1:{}/api/{}",
    SOL_SAFEKEY_API_PORT, path
  );

  let client = reqwest::Client::builder()
    .timeout(std::time::Duration::from_secs(120))
    .build()
    .map_err(|e| e.to_string())?;

  let method_upper = method.to_uppercase();
  let mut req = match method_upper.as_str() {
    "GET" => client.get(&url),
    "POST" => client.post(&url),
    "PUT" => client.put(&url),
    "DELETE" => client.delete(&url),
    "PATCH" => client.patch(&url),
    _ => return Err(format!("unsupported HTTP method: {}", method)),
  };

  req = req.header("Content-Type", "application/json");
  if let Some(b) = body {
    req = req.body(b);
  }

  let resp = req.send().await.map_err(|e| e.to_string())?;
  let status = resp.status().as_u16();
  let body = resp.text().await.map_err(|e| e.to_string())?;

  Ok(ProxyResponse { status, body })
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![proxy_api_request])
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
