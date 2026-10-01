use std::{env, fs};

fn main() {
    let root = env::var("CARGO_MANIFEST_DIR").expect("Cargo manifest directory");
    let package: serde_json::Value = serde_json::from_str(
        &fs::read_to_string(format!("{root}/../package.json")).expect("package.json"),
    )
    .expect("valid package.json");
    let health_text = fs::read_to_string(format!("{root}/../dist/system-update-health.json"))
        .expect("Run npm run build before building the web server");
    let health: serde_json::Value =
        serde_json::from_str(&health_text).expect("valid web build metadata");
    let version = package["version"].as_str().expect("package version");
    assert_eq!(
        health["version"].as_str(),
        Some(version),
        "Static and Rust versions must agree"
    );
    assert_eq!(health["component"].as_str(), Some("web"));
    assert_eq!(health["maintenanceProtocol"].as_u64(), Some(1));
    if let Ok(commit) = env::var("SOURCE_COMMIT") {
        assert_eq!(
            health["sourceCommit"].as_str(),
            Some(commit.as_str()),
            "Static and Rust commits must agree"
        );
    }
    println!("cargo:rustc-env=PKG_VERSION={version}");
    println!("cargo:rerun-if-env-changed=SOURCE_COMMIT");
    println!("cargo:rerun-if-changed=../package.json");
    println!("cargo:rerun-if-changed=../dist");
}
