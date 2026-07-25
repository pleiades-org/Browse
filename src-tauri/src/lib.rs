use serde::{Deserialize, Serialize};
use std::collections::HashSet;
use std::fs::File;
use std::io::Write;
use std::path::PathBuf;
use std::process::Command;

#[cfg(windows)]
use std::os::windows::process::CommandExt;

/// Hide console windows when spawning tools from the GUI app.
#[cfg(windows)]
const CREATE_NO_WINDOW: u32 = 0x0800_0000;

#[derive(Serialize)]
struct CmdResult {
    ok: bool,
    message: String,
    code: i32,
}

#[derive(Deserialize)]
struct ScanEntry {
    id: String,
    source: String,
}

fn apply_no_window(cmd: &mut Command) {
    #[cfg(windows)]
    {
        cmd.creation_flags(CREATE_NO_WINDOW);
    }
}

fn run_cmd(program: &str, args: &[&str]) -> Result<CmdResult, String> {
    let mut cmd = Command::new(program);
    cmd.args(args);
    apply_no_window(&mut cmd);
    let output = cmd
        .output()
        .map_err(|e| format!("Failed to spawn {program}: {e}. Is it installed and on PATH?"))?;

    let stdout = String::from_utf8_lossy(&output.stdout).trim().to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();
    let code = output.status.code().unwrap_or(-1);
    let ok = output.status.success();
    let message = if !stdout.is_empty() {
        stdout
    } else if !stderr.is_empty() {
        stderr
    } else if ok {
        "OK".into()
    } else {
        format!("{program} exited with code {code}")
    };

    Ok(CmdResult { ok, message, code })
}

fn run_cmd_path(program: &PathBuf, args: &[&str]) -> Result<CmdResult, String> {
    let mut cmd = Command::new(program);
    cmd.args(args);
    apply_no_window(&mut cmd);
    let output = cmd
        .output()
        .map_err(|e| format!("Failed to spawn {:?}: {e}", program))?;

    let stdout = String::from_utf8_lossy(&output.stdout).trim().to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();
    let code = output.status.code().unwrap_or(-1);
    let ok = output.status.success();
    let message = if !stdout.is_empty() {
        stdout
    } else if !stderr.is_empty() {
        stderr
    } else if ok {
        "OK".into()
    } else {
        format!("Installer exited with code {code}")
    };

    Ok(CmdResult { ok, message, code })
}

/// True if `cmd` resolves on PATH (`where` / `which`).
fn command_on_path(cmd: &str) -> bool {
    #[cfg(windows)]
    {
        run_cmd("where.exe", &[cmd])
            .map(|r| r.ok && !r.message.is_empty() && !r.message.to_ascii_lowercase().contains("could not find"))
            .unwrap_or(false)
    }
    #[cfg(not(windows))]
    {
        run_cmd("which", &[cmd])
            .map(|r| r.ok && !r.message.is_empty())
            .unwrap_or(false)
    }
}

/// CLI binaries that imply a catalog source is present (even if not via winget).
fn path_hints_for_source(source: &str) -> Vec<&'static str> {
    let s = source.to_ascii_lowercase();
    let id = s.split(':').nth(1).unwrap_or(s.as_str());
    // strip query / @tag for github
    let id = id.split(['?', '@']).next().unwrap_or(id);

    if id.contains("oven-sh.bun") {
        return vec!["bun"];
    }
    if id.contains("openjs.nodejs") {
        return vec!["node"];
    }
    if id.contains("denoland.deno") {
        return vec!["deno"];
    }
    if id.contains("pnpm.pnpm") || id.ends_with("/pnpm") || id == "pnpm" {
        return vec!["pnpm"];
    }
    if id.contains("yarn.yarn") {
        return vec!["yarn"];
    }
    if id.contains("git.git") {
        return vec!["git"];
    }
    if id.contains("github.cli") {
        return vec!["gh"];
    }
    if id.contains("rustlang.rust") || id.contains("rustlang.rustup") {
        return vec!["rustc", "cargo", "rustup"];
    }
    if id.contains("python.python") {
        return vec!["python", "python3"];
    }
    if id.contains("astral-sh.uv") {
        return vec!["uv"];
    }
    if id.contains("golang.go") {
        return vec!["go"];
    }
    if id.contains("docker.dockerdesktop") {
        return vec!["docker"];
    }
    if id.contains("microsoft.visualstudiocode") {
        return vec!["code"];
    }
    if id.contains("anysphere.cursor") {
        return vec!["cursor"];
    }
    if id.contains("helix.helix") {
        return vec!["hx"];
    }
    if id.contains("alacritty.alacritty") {
        return vec!["alacritty"];
    }
    if id.contains("gyan.ffmpeg") {
        return vec!["ffmpeg"];
    }
    if id.contains("hashicorp.terraform") {
        return vec!["terraform"];
    }
    if id.contains("coreybutler.nvmforwindows") {
        return vec!["nvm"];
    }
    if id.contains("chocolatey.chocolatey") {
        return vec!["choco"];
    }
    if id.contains("7zip.7zip") {
        return vec!["7z"];
    }
    if id.contains("ipfs.ipfs-desktop") || id.contains("ipfs.kubo") {
        return vec!["ipfs"];
    }
    if s.starts_with("cargo:") {
        // cargo install name — binary often matches crate name
        let crate_name = id.to_string();
        // can't return owned easily; handle cargo in probe instead
        let _ = crate_name;
        return vec![];
    }
    if s.starts_with("npm:") {
        return vec![];
    }
    vec![]
}

/// Parse `winget list` table into a set of package IDs (lowercased).
fn parse_winget_ids(output: &str) -> HashSet<String> {
    let mut ids = HashSet::new();
    for line in output.lines() {
        let t = line.trim();
        if t.is_empty()
            || t.starts_with('-')
            || t.starts_with("Name")
            || t.starts_with("\u{feff}Name")
        {
            continue;
        }
        for token in t.split_whitespace() {
            // Winget IDs: Publisher.Package — skip pure versions like 1.2.3
            let is_version = token.chars().all(|c| c.is_ascii_digit() || c == '.' || c == '-');
            if is_version {
                continue;
            }
            if token.contains('.')
                || token.starts_with("ARP\\")
                || token.starts_with("MSIX\\")
                || token.starts_with("ARP/")
                || token.starts_with("MSIX/")
            {
                ids.insert(token.to_ascii_lowercase());
            }
        }
    }
    ids
}

fn list_winget_ids() -> HashSet<String> {
    // Prefer full list once (faster than N× winget list --id)
    match run_cmd(
        "winget",
        &[
            "list",
            "--disable-interactivity",
            "--accept-source-agreements",
        ],
    ) {
        Ok(r) if !r.message.is_empty() => parse_winget_ids(&r.message),
        _ => HashSet::new(),
    }
}

fn list_npm_global() -> HashSet<String> {
    let mut set = HashSet::new();
    // JSON is easiest to parse
    if let Ok(r) = run_cmd("npm", &["list", "-g", "--depth=0", "--json"]) {
        if let Ok(v) = serde_json::from_str::<serde_json::Value>(&r.message) {
            if let Some(deps) = v.get("dependencies").and_then(|d| d.as_object()) {
                for k in deps.keys() {
                    set.insert(k.to_ascii_lowercase());
                }
            }
        }
    }
    // Fallback: plain list
    if set.is_empty() {
        if let Ok(r) = run_cmd("npm", &["list", "-g", "--depth=0"]) {
            for line in r.message.lines() {
                let line = line.trim();
                // └── pkg@1.2.3
                if let Some(rest) = line
                    .strip_prefix("├── ")
                    .or_else(|| line.strip_prefix("└── "))
                    .or_else(|| line.strip_prefix("+-- "))
                    .or_else(|| line.strip_prefix("`-- "))
                {
                    let name = rest.split('@').next().unwrap_or(rest).trim();
                    if !name.is_empty() && name != "(empty)" {
                        set.insert(name.to_ascii_lowercase());
                    }
                }
            }
        }
    }
    set
}

fn list_pip_packages() -> HashSet<String> {
    let mut set = HashSet::new();
    for bin in ["pip", "pip3"] {
        if let Ok(r) = run_cmd(bin, &["list", "--format=freeze"]) {
            if !r.ok && r.message.is_empty() {
                continue;
            }
            for line in r.message.lines() {
                let name = line.split('=').next().unwrap_or("").trim();
                if !name.is_empty() {
                    set.insert(name.to_ascii_lowercase());
                }
            }
            if !set.is_empty() {
                break;
            }
        }
    }
    set
}

fn list_brew_formulae() -> HashSet<String> {
    let mut set = HashSet::new();
    if let Ok(r) = run_cmd("brew", &["list", "--formula", "-1"]) {
        for line in r.message.lines() {
            let n = line.trim();
            if !n.is_empty() {
                set.insert(n.to_ascii_lowercase());
            }
        }
    }
    if let Ok(r) = run_cmd("brew", &["list", "--cask", "-1"]) {
        for line in r.message.lines() {
            let n = line.trim();
            if !n.is_empty() {
                set.insert(n.to_ascii_lowercase());
            }
        }
    }
    set
}

fn list_flatpak_ids() -> HashSet<String> {
    let mut set = HashSet::new();
    if let Ok(r) = run_cmd("flatpak", &["list", "--columns=application"]) {
        for line in r.message.lines() {
            let n = line.trim();
            if !n.is_empty() && n != "Application ID" {
                set.insert(n.to_ascii_lowercase());
            }
        }
    }
    set
}

fn list_cargo_bins() -> HashSet<String> {
    let mut set = HashSet::new();
    if let Ok(r) = run_cmd("cargo", &["install", "--list"]) {
        for line in r.message.lines() {
            // "rg v14.0.0:" or "    rg.exe"
            let t = line.trim();
            if t.is_empty() {
                continue;
            }
            if !line.starts_with(' ') && !line.starts_with('\t') {
                // crate line: name version:
                if let Some(name) = t.split_whitespace().next() {
                    set.insert(name.to_ascii_lowercase());
                }
            }
        }
    }
    set
}

fn any_exe_in_dir(dir: &PathBuf) -> bool {
    if !dir.is_dir() {
        return false;
    }
    std::fs::read_dir(dir)
        .ok()
        .map(|rd| {
            rd.filter_map(|e| e.ok()).any(|e| {
                e.path()
                    .extension()
                    .and_then(|x| x.to_str())
                    .map(|x| x.eq_ignore_ascii_case("exe"))
                    .unwrap_or(false)
            })
        })
        .unwrap_or(false)
}

fn github_path_installed(source: &str) -> bool {
    let s = source;
    if s.starts_with("github:pleiades-org/Core") {
        // Installer may land under Roaming or Local\Programs; exe name varies.
        let roaming = std::env::var("APPDATA").unwrap_or_default();
        let local = std::env::var("LOCALAPPDATA").unwrap_or_default();
        let candidates = [
            PathBuf::from(&roaming)
                .join("Core Launcher")
                .join("Core Launcher.exe"),
            PathBuf::from(&roaming)
                .join("Core Launcher")
                .join("Core.exe"),
            PathBuf::from(&local)
                .join("Programs")
                .join("Core Launcher")
                .join("Core Launcher.exe"),
            PathBuf::from(&local)
                .join("Programs")
                .join("Core Launcher")
                .join("Core.exe"),
            PathBuf::from(&local)
                .join("Core Launcher")
                .join("Core Launcher.exe"),
            PathBuf::from(&local)
                .join("Core Launcher")
                .join("Core.exe"),
        ];
        if candidates.iter().any(|p| p.exists()) {
            return true;
        }
        // Folder present with any .exe (portable / alternate names)
        let dirs = [
            PathBuf::from(&roaming).join("Core Launcher"),
            PathBuf::from(&local)
                .join("Programs")
                .join("Core Launcher"),
            PathBuf::from(&local).join("Core Launcher"),
        ];
        return dirs.iter().any(any_exe_in_dir);
    }
    if s.starts_with("github:RobertTGreat/Pleiades")
        || s.starts_with("github:roberttgreat/pleiades")
    {
        let local = std::env::var("LOCALAPPDATA").unwrap_or_default();
        let roaming = std::env::var("APPDATA").unwrap_or_default();
        let candidates = [
            PathBuf::from(&local)
                .join("Pleiades Chat")
                .join("chat.exe"),
            PathBuf::from(&roaming)
                .join("Pleiades Chat")
                .join("chat.exe"),
        ];
        return candidates.iter().any(|p| p.exists());
    }
    false
}

fn source_installed(
    source: &str,
    winget: &HashSet<String>,
    npm: &HashSet<String>,
    pip: &HashSet<String>,
    brew: &HashSet<String>,
    flatpak: &HashSet<String>,
    cargo: &HashSet<String>,
) -> bool {
    let source = source.trim();
    if source.is_empty() {
        return false;
    }

    if source.starts_with("github:") {
        return github_path_installed(source);
    }

    if let Some(id) = source.strip_prefix("winget:") {
        let id_l = id.to_ascii_lowercase();
        if winget.contains(&id_l) {
            return true;
        }
        // PATH fallback for CLIs installed outside winget
        for cmd in path_hints_for_source(source) {
            if command_on_path(cmd) {
                return true;
            }
        }
        return false;
    }

    if let Some(pkg) = source.strip_prefix("npm:") {
        let name = pkg.split('/').next_back().unwrap_or(pkg).to_ascii_lowercase();
        if npm.contains(&name) || npm.contains(&pkg.to_ascii_lowercase()) {
            return true;
        }
        // scoped packages: @scope/name
        if npm.contains(&pkg.to_ascii_lowercase()) {
            return true;
        }
        return false;
    }

    if let Some(pkg) = source.strip_prefix("pip:") {
        return pip.contains(&pkg.to_ascii_lowercase());
    }

    if let Some(pkg) = source.strip_prefix("brew:") {
        return brew.contains(&pkg.to_ascii_lowercase());
    }
    if let Some(pkg) = source.strip_prefix("brew-cask:") {
        return brew.contains(&pkg.to_ascii_lowercase());
    }

    if let Some(pkg) = source.strip_prefix("flatpak:") {
        return flatpak.contains(&pkg.to_ascii_lowercase());
    }

    if let Some(pkg) = source.strip_prefix("cargo:") {
        let name = pkg.to_ascii_lowercase();
        if cargo.contains(&name) {
            return true;
        }
        // binary often matches crate name
        return command_on_path(pkg) || command_on_path(&name);
    }

    // Generic PATH hints for any remaining source
    for cmd in path_hints_for_source(source) {
        if command_on_path(cmd) {
            return true;
        }
    }

    false
}

/// github:owner/repo/Asset.exe@latest?args=/Q:U
/// github:owner/repo/Asset.exe@0.1.3-RC?args=/Q:U
fn parse_github_source(source: &str) -> Result<(String, String, String, String, Vec<String>), String> {
    let rest = source
        .strip_prefix("github:")
        .ok_or_else(|| "not a github source".to_string())?;

    let (path_part, query) = match rest.split_once('?') {
        Some((p, q)) => (p, q),
        None => (rest, ""),
    };

    let (repo_asset, tag) = match path_part.split_once('@') {
        Some((ra, t)) => (ra, t),
        None => (path_part, "latest"),
    };

    // owner/repo/AssetName.exe
    let parts: Vec<&str> = repo_asset.splitn(3, '/').collect();
    if parts.len() < 3 {
        return Err(
            "github source must be github:owner/repo/Asset.exe@tag?args=...".into(),
        );
    }
    let owner = parts[0].to_string();
    let repo = parts[1].to_string();
    let asset = parts[2].to_string();
    let tag = tag.to_string();

    let mut args: Vec<String> = Vec::new();
    for pair in query.split('&') {
        if pair.is_empty() {
            continue;
        }
        if let Some(v) = pair.strip_prefix("args=") {
            // support /Q:U or multiple space-separated
            for a in v.split_whitespace() {
                args.push(a.to_string());
            }
        }
    }

    Ok((owner, repo, asset, tag, args))
}

fn install_from_github(source: &str) -> Result<CmdResult, String> {
    let (owner, repo, asset_name, tag, silent_args) = parse_github_source(source)?;

    let api_url = if tag == "latest" {
        format!("https://api.github.com/repos/{owner}/{repo}/releases/latest")
    } else {
        format!("https://api.github.com/repos/{owner}/{repo}/releases/tags/{tag}")
    };

    let agent = ureq::AgentBuilder::new()
        .timeout(std::time::Duration::from_secs(120))
        .build();

    let release: serde_json::Value = agent
        .get(&api_url)
        .set("User-Agent", "Browse-Installer")
        .set("Accept", "application/vnd.github+json")
        .call()
        .map_err(|e| format!("GitHub release fetch failed: {e}"))?
        .into_json()
        .map_err(|e| format!("GitHub release JSON parse failed: {e}"))?;

    let assets = release
        .get("assets")
        .and_then(|a| a.as_array())
        .ok_or_else(|| "Release has no assets".to_string())?;

    let asset = assets
        .iter()
        .find(|a| {
            a.get("name")
                .and_then(|n| n.as_str())
                .map(|n| asset_name_matches(n, &asset_name))
                .unwrap_or(false)
        })
        .ok_or_else(|| format!("Asset '{asset_name}' not found in release '{tag}'"))?;

    let resolved_asset_name = asset
        .get("name")
        .and_then(|n| n.as_str())
        .unwrap_or(&asset_name)
        .to_string();

    let download_url = asset
        .get("browser_download_url")
        .and_then(|u| u.as_str())
        .ok_or_else(|| "Asset missing browser_download_url".to_string())?
        .to_string();

    let resolved_tag = release
        .get("tag_name")
        .and_then(|t| t.as_str())
        .unwrap_or(&tag)
        .to_string();

    let mut temp = std::env::temp_dir();
    temp.push(format!("browse-install-{}-{}", repo, resolved_asset_name));

    // Download
    let resp = agent
        .get(&download_url)
        .set("User-Agent", "Browse-Installer")
        .call()
        .map_err(|e| format!("Download failed: {e}"))?;

    let mut bytes: Vec<u8> = Vec::new();
    resp.into_reader()
        .read_to_end(&mut bytes)
        .map_err(|e| format!("Read download failed: {e}"))?;

    {
        let mut f = File::create(&temp).map_err(|e| format!("Temp create failed: {e}"))?;
        f.write_all(&bytes)
            .map_err(|e| format!("Temp write failed: {e}"))?;
    }

    // Run installer with silent args (default /Q:U if none provided for .exe)
    let mut args: Vec<String> = silent_args;
    if args.is_empty() && resolved_asset_name.to_lowercase().ends_with(".exe") {
        args.push("/Q:U".into());
    }
    let arg_refs: Vec<&str> = args.iter().map(|s| s.as_str()).collect();

    let result = run_cmd_path(&temp, &arg_refs);

    // Best-effort cleanup
    let _ = std::fs::remove_file(&temp);

    match result {
        Ok(mut r) => {
            if r.ok {
                r.message = format!(
                    "Installed {resolved_asset_name} from {owner}/{repo}@{resolved_tag} (silent)"
                );
            }
            Ok(r)
        }
        Err(e) => Err(e),
    }
}

/// Exact match, or simple `*` wildcard (e.g. `Pleiades.Chat_*_x64-setup.exe`).
fn asset_name_matches(actual: &str, pattern: &str) -> bool {
    if actual.eq_ignore_ascii_case(pattern) {
        return true;
    }
    if !pattern.contains('*') {
        return false;
    }
    let actual_l = actual.to_ascii_lowercase();
    let pattern_l = pattern.to_ascii_lowercase();
    let parts: Vec<&str> = pattern_l.split('*').collect();
    let mut rest = actual_l.as_str();
    for (i, part) in parts.iter().enumerate() {
        if part.is_empty() {
            continue;
        }
        if i == 0 {
            if !rest.starts_with(part) {
                return false;
            }
            rest = &rest[part.len()..];
            continue;
        }
        if i == parts.len() - 1 {
            return rest.ends_with(part);
        }
        if let Some(idx) = rest.find(part) {
            rest = &rest[idx + part.len()..];
        } else {
            return false;
        }
    }
    true
}

/// Install via winget / brew / flatpak / npm / pip / GitHub release.
#[tauri::command]
fn install_package(source: String) -> Result<CmdResult, String> {
    let source = source.trim();

    if source.starts_with("github:") {
        return install_from_github(source);
    }
    if let Some(id) = source.strip_prefix("winget:") {
        return run_cmd(
            "winget",
            &[
                "install",
                "--id",
                id,
                "-e",
                "--accept-package-agreements",
                "--accept-source-agreements",
                "--disable-interactivity",
            ],
        );
    }
    if let Some(pkg) = source.strip_prefix("brew-cask:") {
        return run_cmd("brew", &["install", "--cask", pkg]);
    }
    if let Some(pkg) = source.strip_prefix("brew:") {
        return run_cmd("brew", &["install", pkg]);
    }
    if let Some(pkg) = source.strip_prefix("flatpak:") {
        return run_cmd(
            "flatpak",
            &["install", "-y", "--noninteractive", "flathub", pkg],
        );
    }
    if let Some(pkg) = source.strip_prefix("npm:") {
        return run_cmd("npm", &["install", "-g", pkg]);
    }
    if let Some(pkg) = source.strip_prefix("pip:") {
        return run_cmd("pip", &["install", pkg]);
    }
    if source.starts_with("web:") || source.starts_with("vscode:") {
        return Ok(CmdResult {
            ok: false,
            message: "This package has no automated installer. Use Open on the detail page."
                .into(),
            code: 1,
        });
    }
    Err(format!("Unsupported source: {source}"))
}

/// Uninstall via the matching package manager.
#[tauri::command]
fn uninstall_package(source: String) -> Result<CmdResult, String> {
    let source = source.trim();
    if source.starts_with("github:") {
        return Ok(CmdResult {
            ok: false,
            message: "Uninstall GitHub installs from Windows Settings → Apps (Core Launcher)."
                .into(),
            code: 1,
        });
    }
    if let Some(id) = source.strip_prefix("winget:") {
        return run_cmd(
            "winget",
            &[
                "uninstall",
                "--id",
                id,
                "-e",
                "--disable-interactivity",
                "--accept-source-agreements",
            ],
        );
    }
    if let Some(pkg) = source.strip_prefix("brew-cask:") {
        return run_cmd("brew", &["uninstall", "--cask", pkg]);
    }
    if let Some(pkg) = source.strip_prefix("brew:") {
        return run_cmd("brew", &["uninstall", pkg]);
    }
    if let Some(pkg) = source.strip_prefix("flatpak:") {
        return run_cmd("flatpak", &["uninstall", "-y", pkg]);
    }
    if let Some(pkg) = source.strip_prefix("npm:") {
        return run_cmd("npm", &["uninstall", "-g", pkg]);
    }
    if let Some(pkg) = source.strip_prefix("pip:") {
        return run_cmd("pip", &["uninstall", "-y", pkg]);
    }
    Ok(CmdResult {
        ok: false,
        message: "Uninstall not supported for this source.".into(),
        code: 1,
    })
}

/// Query whether a single package appears installed (best-effort, targeted).
#[tauri::command]
fn check_installed(source: String) -> Result<bool, String> {
    let source = source.trim();
    if source.is_empty() {
        return Ok(false);
    }
    if source.starts_with("github:") {
        return Ok(github_path_installed(source));
    }
    if let Some(id) = source.strip_prefix("winget:") {
        let r = run_cmd(
            "winget",
            &[
                "list",
                "--id",
                id,
                "-e",
                "--disable-interactivity",
                "--accept-source-agreements",
            ],
        );
        if let Ok(r) = r {
            let id_l = id.to_ascii_lowercase();
            if r.message.to_ascii_lowercase().contains(&id_l)
                && !r.message.to_ascii_lowercase().contains("no installed package")
            {
                return Ok(true);
            }
        }
        for cmd in path_hints_for_source(source) {
            if command_on_path(cmd) {
                return Ok(true);
            }
        }
        return Ok(false);
    }
    if let Some(pkg) = source.strip_prefix("npm:") {
        let npm = list_npm_global();
        let name = pkg.split('/').next_back().unwrap_or(pkg).to_ascii_lowercase();
        return Ok(npm.contains(&name) || npm.contains(&pkg.to_ascii_lowercase()));
    }
    if let Some(pkg) = source.strip_prefix("pip:") {
        return Ok(list_pip_packages().contains(&pkg.to_ascii_lowercase()));
    }
    if let Some(pkg) = source.strip_prefix("brew:") {
        let r = run_cmd("brew", &["list", "--versions", pkg])?;
        return Ok(r.ok && !r.message.is_empty());
    }
    if let Some(pkg) = source.strip_prefix("brew-cask:") {
        let r = run_cmd("brew", &["list", "--cask", "--versions", pkg])?;
        return Ok(r.ok && !r.message.is_empty());
    }
    if let Some(pkg) = source.strip_prefix("flatpak:") {
        let r = run_cmd("flatpak", &["info", pkg])?;
        return Ok(r.ok);
    }
    if let Some(pkg) = source.strip_prefix("cargo:") {
        if command_on_path(pkg) {
            return Ok(true);
        }
        return Ok(list_cargo_bins().contains(&pkg.to_ascii_lowercase()));
    }
    for cmd in path_hints_for_source(source) {
        if command_on_path(cmd) {
            return Ok(true);
        }
    }
    Ok(false)
}

/// Bulk scan — one winget/npm/pip/brew list, then match catalog entries.
/// Returns package **ids** that appear installed on this machine.
#[tauri::command]
fn scan_installed(entries: Vec<ScanEntry>) -> Result<Vec<String>, String> {
    let winget = list_winget_ids();
    let npm = list_npm_global();
    let pip = list_pip_packages();
    let brew = list_brew_formulae();
    let flatpak = list_flatpak_ids();
    let cargo = list_cargo_bins();

    let mut found = Vec::new();
    for e in entries {
        if source_installed(
            e.source.trim(),
            &winget,
            &npm,
            &pip,
            &brew,
            &flatpak,
            &cargo,
        ) {
            found.push(e.id);
        }
    }
    Ok(found)
}

#[tauri::command]
fn host_os() -> String {
    std::env::consts::OS.to_string()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            install_package,
            uninstall_package,
            check_installed,
            scan_installed,
            host_os
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
