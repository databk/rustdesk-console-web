use actix_web::{
    HttpRequest, HttpResponse, HttpServer, App, web, middleware::Logger,
};
use rust_embed::Embed;
use reqwest::Client;
use std::env;

#[derive(Embed)]
#[folder = "../dist/"]
struct Assets;

struct AppState {
    client: Client,
    backend_url: String,
}

async fn index() -> HttpResponse {
    match Assets::get("index.html") {
        Some(content) => {
            let body = content.data;
            HttpResponse::Ok()
                .content_type("text/html; charset=utf-8")
                .body(body.into_owned())
        }
        None => HttpResponse::NotFound().body("index.html not found"),
    }
}

async fn static_files(req: HttpRequest) -> HttpResponse {
    let path = req.match_info().query("filename").trim_start_matches('/');

    if path.is_empty() {
        return index().await;
    }

    match Assets::get(path) {
        Some(content) => {
            let mime = mime_guess::from_path(path).first_or_octet_stream();
            let body = content.data;
            HttpResponse::Ok()
                .content_type(mime.as_ref())
                .body(body.into_owned())
        }
        None => index().await,
    }
}

async fn api_proxy(
    req: HttpRequest,
    body: web::Bytes,
    state: web::Data<AppState>,
) -> HttpResponse {
    let path = req.uri().path_and_query().map(|pq| pq.as_str()).unwrap_or("/api/");
    let url = format!("{}{}", state.backend_url.trim_end_matches('/'), path);

    // Convert actix Method to reqwest Method
    let method = reqwest::Method::from_bytes(req.method().as_str().as_bytes())
        .unwrap_or(reqwest::Method::GET);
    let mut builder = state.client.request(method, &url);

    // Forward headers
    for (key, value) in req.headers() {
        if key == "host" || key == "connection" {
            continue;
        }
        if let Ok(v) = value.to_str() {
            builder = builder.header(key.as_str(), v);
        }
    }

    // Set forwarding headers
    if let Some(host) = req.headers().get("host") {
        if let Ok(v) = host.to_str() {
            builder = builder.header("X-Forwarded-Host", v);
        }
    }
    builder = builder.header("X-Forwarded-Proto", "http");

    let resp = builder.body(body).send().await;

    match resp {
        Ok(upstream) => {
            let status = upstream.status().as_u16();
            let mut resp = HttpResponse::build(
                actix_web::http::StatusCode::from_u16(status)
                    .unwrap_or(actix_web::http::StatusCode::BAD_GATEWAY)
            );
            for (key, value) in upstream.headers() {
                if key == "connection" || key == "transfer-encoding" {
                    continue;
                }
                resp.insert_header((key.as_str(), value.to_str().unwrap_or("")));
            }
            resp.body(upstream.bytes().await.unwrap_or_default().to_vec())
        }
        Err(e) => {
            log::error!("Proxy error: {}", e);
            HttpResponse::BadGateway()
                .body(format!("Proxy error: {}", e))
        }
    }
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    env_logger::Builder::from_env(env_logger::Env::default().default_filter_or("info"))
        .init();

    let port: u16 = env::var("PORT")
        .unwrap_or_else(|_| "80".to_string())
        .parse()
        .unwrap_or(80);

    let backend_url = env::var("BACKEND_URL")
        .unwrap_or_else(|_| {
            log::warn!("BACKEND_URL not set, API proxy will not work");
            "http://localhost:21114".to_string()
        });

    let bind_addr = env::var("BIND_ADDR")
        .unwrap_or_else(|_| "0.0.0.0".to_string());

    log::info!("rustdesk-console-web v{}", env!("PKG_VERSION"));
    log::info!("Starting server on {}:{}", bind_addr, port);
    log::info!("Backend URL: {}", backend_url);

    let client = Client::builder()
        .no_proxy()
        .build()
        .expect("Failed to create HTTP client");

    let data = web::Data::new(AppState {
        client,
        backend_url,
    });

    HttpServer::new(move || {
        App::new()
            .wrap(Logger::default())
            .app_data(data.clone())
            .route("/api/{path:.*}", web::route().to(api_proxy))
            .route("/{filename:.*}", web::get().to(static_files))
            .route("/", web::get().to(index))
    })
    .bind(format!("{}:{}", bind_addr, port))?
    .run()
    .await
}
