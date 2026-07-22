use std::fs;

fn main() {
    let manifest_dir = std::env::var("CARGO_MANIFEST_DIR").unwrap();
    let pkg_json_path = format!("{}/../package.json", manifest_dir);

    if let Ok(content) = fs::read_to_string(&pkg_json_path) {
        // Extract version from package.json: "version": "1.2.3",
        if let Some(version) = content
            .lines()
            .find_map(|line| {
                let trimmed = line.trim();
                if trimmed.starts_with("\"version\"") {
                    // Split on ':' and extract the JSON string value
                    let parts: Vec<&str> = trimmed.splitn(2, ':').collect();
                    if parts.len() == 2 {
                        let v = parts[1]
                            .trim()
                            .trim_matches(',')
                            .trim()
                            .trim_matches('"')
                            .to_string();
                        if !v.is_empty() {
                            return Some(v);
                        }
                    }
                }
                None
            })
        {
            println!("cargo:rustc-env=PKG_VERSION={}", version);
        } else {
            println!("cargo:rustc-env=PKG_VERSION=0.0.0");
        }
    } else {
        println!("cargo:rustc-env=PKG_VERSION=0.0.0");
    }

    // Rerun if package.json changes
    println!("cargo:rerun-if-changed=../package.json");
}
