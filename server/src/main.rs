use actix_web::{App, HttpRequest, HttpResponse, HttpServer, middleware::Logger, web};
use reqwest::Client;
use rust_embed::Embed;
use std::env;
use std::time::Duration;

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
                .insert_header(("Cache-Control", "no-store"))
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
        None if path
            .rsplit('/')
            .next()
            .is_some_and(|name| name.contains('.')) =>
        {
            HttpResponse::NotFound().finish()
        }
        None => index().await,
    }
}

async fn update_health() -> HttpResponse {
    match Assets::get("system-update-health.json") {
        Some(content) => HttpResponse::Ok()
            .insert_header(("Cache-Control", "no-store"))
            .content_type("application/json")
            .body(content.data.into_owned()),
        None => HttpResponse::ServiceUnavailable().finish(),
    }
}

async fn api_proxy(req: HttpRequest, body: web::Bytes, state: web::Data<AppState>) -> HttpResponse {
    let path = req
        .uri()
        .path_and_query()
        .map(|pq| pq.as_str())
        .unwrap_or("/api/");
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
                    .unwrap_or(actix_web::http::StatusCode::BAD_GATEWAY),
            );
            for (key, value) in upstream.headers() {
                if key == "connection" || key == "transfer-encoding" {
                    continue;
                }
                resp.insert_header((key.as_str(), value.to_str().unwrap_or("")));
            }
            match upstream.bytes().await {
                Ok(bytes) => resp.body(bytes.to_vec()),
                Err(_) => HttpResponse::BadGateway().body("Backend response interrupted"),
            }
        }
        Err(e) => {
            log::error!("Proxy error: {}", e);
            HttpResponse::BadGateway().body("Backend temporarily unavailable")
        }
    }
}

fn configure_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::resource("/system-update-health.json")
            .route(web::get().to(update_health))
            .route(web::head().to(update_health)),
    )
    .route("/api/{path:.*}", web::route().to(api_proxy))
    .service(
        web::resource("/")
            .route(web::get().to(index))
            .route(web::head().to(index)),
    )
    .service(
        web::resource("/index.html")
            .route(web::get().to(index))
            .route(web::head().to(index)),
    )
    .service(
        web::resource("/{filename:.*}")
            .route(web::get().to(static_files))
            .route(web::head().to(static_files)),
    );
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    env_logger::Builder::from_env(env_logger::Env::default().default_filter_or("info")).init();

    let port: u16 = env::var("PORT")
        .unwrap_or_else(|_| "21114".to_string())
        .parse()
        .unwrap_or(21114);

    let backend_url = env::var("BACKEND_URL").unwrap_or_else(|_| {
        log::warn!("BACKEND_URL not set, API proxy will not work");
        "http://localhost:3000".to_string()
    });

    let bind_addr = env::var("BIND_ADDR").unwrap_or_else(|_| "0.0.0.0".to_string());

    log::info!("rustdesk-console-web v{}", env!("PKG_VERSION"));
    log::info!("Starting server on {}:{}", bind_addr, port);
    log::info!("Backend URL: {}", backend_url);

    let client = Client::builder()
        .no_proxy()
        .connect_timeout(Duration::from_secs(5))
        .timeout(Duration::from_secs(30))
        .pool_idle_timeout(Duration::from_secs(5))
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
            .configure(configure_routes)
    })
    .bind(format!("{}:{}", bind_addr, port))?
    .run()
    .await
}

#[cfg(test)]
mod tests {
    use super::*;
    use actix_web::{http::StatusCode, test};
    use std::io::{Read, Write};
    use std::net::{SocketAddr, TcpListener, TcpStream};

    async fn assert_head_wire_is_empty(addr: SocketAddr, path: &str, status: u16) {
        let request = format!("HEAD {path} HTTP/1.1\r\nHost: {addr}\r\nConnection: close\r\n\r\n");
        let response = actix_web::rt::task::spawn_blocking(move || {
            let mut stream = TcpStream::connect_timeout(&addr, Duration::from_secs(5)).unwrap();
            stream
                .set_read_timeout(Some(Duration::from_secs(5)))
                .unwrap();
            stream.write_all(request.as_bytes()).unwrap();
            let mut response = Vec::new();
            stream.read_to_end(&mut response).unwrap();
            response
        })
        .await
        .unwrap();
        assert!(
            response.starts_with(format!("HTTP/1.1 {status} ").as_bytes()),
            "{path}"
        );
        let header_end = response.windows(4).position(|b| b == b"\r\n\r\n").unwrap() + 4;
        assert_eq!(response.len(), header_end, "HEAD sent a body for {path}");
    }

    #[actix_web::test]
    async fn real_http_get_and_head_match_for_pages_health_and_every_asset() {
        let listener = TcpListener::bind("127.0.0.1:0").unwrap();
        let addr = listener.local_addr().unwrap();
        let server = HttpServer::new(|| App::new().configure(configure_routes))
            .workers(1)
            .listen(listener)
            .unwrap()
            .run();
        let handle = server.handle();
        actix_web::rt::spawn(server);
        let client = Client::builder().no_proxy().build().unwrap();
        let mut paths = vec!["/".to_string(), "/devices".to_string()];
        paths.extend(Assets::iter().map(|name| format!("/{name}")));
        for path in paths {
            let url = format!("http://{addr}{path}");
            let get = client.get(&url).send().await.unwrap();
            let head = client.head(&url).send().await.unwrap();
            assert_eq!(get.status(), reqwest::StatusCode::OK, "GET {path}");
            assert_eq!(head.status(), get.status(), "HEAD {path}");
            for header in ["content-type", "cache-control", "content-length"] {
                assert_eq!(
                    head.headers().get(header),
                    get.headers().get(header),
                    "{header}: {path}"
                );
            }
            let asset = if path == "/" || path == "/devices" {
                "index.html"
            } else {
                path.trim_start_matches('/')
            };
            if asset == "index.html" || asset == "system-update-health.json" {
                assert_eq!(get.headers().get("cache-control").unwrap(), "no-store");
            }
            let expected_mime = match asset {
                "index.html" => "text/html; charset=utf-8".to_string(),
                _ => mime_guess::from_path(asset)
                    .first_or_octet_stream()
                    .to_string(),
            };
            assert_eq!(
                get.headers().get("content-type").unwrap().to_str().unwrap(),
                expected_mime,
                "{path}"
            );
            assert_eq!(
                get.bytes().await.unwrap().as_ref(),
                Assets::get(asset).unwrap().data.as_ref(),
                "{path}"
            );
            assert!(head.bytes().await.unwrap().is_empty(), "{path}");
            assert_head_wire_is_empty(addr, &path, 200).await;
        }
        for path in ["/missing-old-chunk.js", "/assets/missing-old-chunk.css"] {
            for method in [reqwest::Method::GET, reqwest::Method::HEAD] {
                let response = client
                    .request(method, format!("http://{addr}{path}"))
                    .send()
                    .await
                    .unwrap();
                assert_eq!(response.status(), reqwest::StatusCode::NOT_FOUND, "{path}");
                assert!(response.bytes().await.unwrap().is_empty());
            }
            assert_head_wire_is_empty(addr, path, 404).await;
        }
        handle.stop(true).await;
    }

    #[actix_web::test]
    async fn real_http_api_proxy_preserves_methods_query_headers_body_and_status() {
        let upstream_listener = TcpListener::bind("127.0.0.1:0").unwrap();
        let upstream_addr = upstream_listener.local_addr().unwrap();
        let upstream = HttpServer::new(|| {
            App::new().route(
                "/api/{path:.*}",
                web::route().to(|req: HttpRequest, body: web::Bytes| async move {
                    assert_eq!(
                        req.headers().get("authorization").unwrap(),
                        "Bearer test-only"
                    );
                    assert_eq!(req.headers().get("x-forwarded-proto").unwrap(), "http");
                    assert!(req.headers().contains_key("x-forwarded-host"));
                    HttpResponse::Accepted()
                        .insert_header(("Cache-Control", "no-store"))
                        .insert_header(("X-Upstream-Method", req.method().as_str()))
                        .insert_header(("X-Upstream-Uri", req.uri().to_string()))
                        .content_type("application/json")
                        .body(body)
                }),
            )
        })
        .workers(1)
        .listen(upstream_listener)
        .unwrap()
        .run();
        let upstream_handle = upstream.handle();
        actix_web::rt::spawn(upstream);
        let listener = TcpListener::bind("127.0.0.1:0").unwrap();
        let addr = listener.local_addr().unwrap();
        let state = web::Data::new(AppState {
            client: Client::builder().no_proxy().build().unwrap(),
            backend_url: format!("http://{upstream_addr}"),
        });
        let server = HttpServer::new(move || {
            App::new()
                .app_data(state.clone())
                .configure(configure_routes)
        })
        .workers(1)
        .listen(listener)
        .unwrap()
        .run();
        let handle = server.handle();
        actix_web::rt::spawn(server);
        let client = Client::builder().no_proxy().build().unwrap();
        for method in [
            reqwest::Method::GET,
            reqwest::Method::HEAD,
            reqwest::Method::POST,
        ] {
            let body = if method == reqwest::Method::POST {
                "{\"probe\":true}"
            } else {
                ""
            };
            let response = client
                .request(
                    method.clone(),
                    format!("http://{addr}/api/system-update/health?probe=ready"),
                )
                .header("Authorization", "Bearer test-only")
                .body(body)
                .send()
                .await
                .unwrap();
            assert_eq!(response.status(), reqwest::StatusCode::ACCEPTED);
            assert_eq!(
                response.headers().get("x-upstream-method").unwrap(),
                method.as_str()
            );
            assert_eq!(
                response.headers().get("x-upstream-uri").unwrap(),
                "/api/system-update/health?probe=ready"
            );
            assert_eq!(response.headers().get("cache-control").unwrap(), "no-store");
            assert_eq!(
                response.headers().get("content-type").unwrap(),
                "application/json"
            );
            assert_eq!(response.bytes().await.unwrap().as_ref(), body.as_bytes());
        }
        handle.stop(true).await;
        upstream_handle.stop(true).await;
    }

    #[actix_web::test]
    async fn health_is_embedded_json_and_never_cached() {
        let app = test::init_service(
            App::new().route("/system-update-health.json", web::get().to(update_health)),
        )
        .await;
        let response = test::call_service(
            &app,
            test::TestRequest::get()
                .uri("/system-update-health.json")
                .to_request(),
        )
        .await;
        assert_eq!(response.status(), StatusCode::OK);
        assert_eq!(response.headers().get("cache-control").unwrap(), "no-store");
        assert_eq!(
            response.headers().get("content-type").unwrap(),
            "application/json"
        );
        let bytes = test::read_body(response).await;
        let text = std::str::from_utf8(&bytes).unwrap();
        assert!(text.contains(env!("PKG_VERSION")));
        assert!(text.contains("sourceCommit"));
        assert!(text.contains("maintenanceProtocol"));
    }

    #[actix_web::test]
    async fn stale_chunk_is_404_and_spa_page_is_not_cached() {
        let app =
            test::init_service(App::new().route("/{filename:.*}", web::get().to(static_files)))
                .await;
        let missing = test::call_service(
            &app,
            test::TestRequest::get()
                .uri("/missing-old-chunk.js")
                .to_request(),
        )
        .await;
        assert_eq!(missing.status(), StatusCode::NOT_FOUND);
        let page =
            test::call_service(&app, test::TestRequest::get().uri("/devices").to_request()).await;
        assert_eq!(page.status(), StatusCode::OK);
        assert_eq!(page.headers().get("cache-control").unwrap(), "no-store");
    }

    #[actix_web::test]
    async fn proxy_preserves_health_path_and_query_and_recovers_after_unavailability() {
        let listener = TcpListener::bind("127.0.0.1:0").unwrap();
        let addr = listener.local_addr().unwrap();
        let state = web::Data::new(AppState {
            client: Client::builder()
                .no_proxy()
                .timeout(Duration::from_secs(2))
                .build()
                .unwrap(),
            backend_url: format!("http://{addr}"),
        });
        let app = test::init_service(
            App::new()
                .app_data(state)
                .route("/api/{path:.*}", web::route().to(api_proxy)),
        )
        .await;
        drop(listener);
        let failed = test::call_service(
            &app,
            test::TestRequest::get()
                .uri("/api/system-update/health")
                .to_request(),
        )
        .await;
        assert_eq!(failed.status(), StatusCode::BAD_GATEWAY);
        assert_eq!(
            test::read_body(failed).await,
            "Backend temporarily unavailable"
        );
        let server = HttpServer::new(|| {
            App::new().route(
                "/api/system-update/health",
                web::get().to(|req: HttpRequest| async move {
                    HttpResponse::Ok().body(req.uri().to_string())
                }),
            )
        })
        .workers(1)
        .bind(addr)
        .unwrap()
        .run();
        let handle = server.handle();
        actix_web::rt::spawn(server);
        let recovered = test::call_service(
            &app,
            test::TestRequest::get()
                .uri("/api/system-update/health?probe=ready")
                .to_request(),
        )
        .await;
        assert_eq!(recovered.status(), StatusCode::OK);
        assert_eq!(
            test::read_body(recovered).await,
            "/api/system-update/health?probe=ready"
        );
        handle.stop(true).await;
    }
}
