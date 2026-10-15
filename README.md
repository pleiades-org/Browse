# Pleiades Browse

A desktop application catalogue and installer with curated packages, installation detection, and a shared download queue.

Browse provides a focused interface for discovering software, reviewing package sources, and installing individual applications or curated bundles. It is built with **Tauri 2, Rust, React 19, and TypeScript**. The checked-in installer configuration targets Windows.

## Features

- **Curated catalogue:** browse applications, categories, and multi-application bundles.
- **Installation queue:** track requested installs and their results in one place.
- **Installed detection:** query supported package managers and executable locations to identify existing software.
- **Source adapters:** route supported entries through winget, Homebrew, Flatpak, npm, pip, or GitHub releases.

Each source requires its corresponding package manager and a compatible platform. Installed detection is best-effort. Entries without automated installation support open their source page instead. Uninstallation support depends on the source; GitHub-release installs may need removal through Windows Settings.

## Build and run

For the Windows desktop build, install **Node.js 22.12+**, npm, Rust with the MSVC toolchain, Visual Studio C++ Build Tools, a Windows SDK, and WebView2. Install winget and any other package managers needed by the catalogue entries you intend to use.

```powershell
git clone https://github.com/pleiades-org/Browse.git
cd Browse
npm ci
npm run tauri dev
```

The Tauri command starts the native application and its frontend development server. `npm run dev` starts the frontend alone and does not provide native package operations.

## Production build

```powershell
npm run build
npm run installer
```

`npm run build` type-checks the frontend, creates the Vite bundle, and generates application icons. `npm run installer` runs the desktop packaging flow and produces an NSIS installer under:

```text
src-tauri/target/release/bundle/nsis/Browse_*_x64-setup.exe
```

The current installer is configured for the current Windows user. Other package-manager adapters exist in the source, but the repository does not configure macOS or Linux release bundles.

## Catalogue and native operations

[`src/data/catalog.ts`](src/data/catalog.ts) defines the curated applications and their installation sources. [`src-tauri/src/lib.rs`](src-tauri/src/lib.rs) implements package-manager commands, GitHub release downloads, and installed-package queries.

Installing a package runs its package manager or downloaded installer and changes the system. Some sources use unattended installer arguments. Review catalogue source identifiers and platform behavior when adding or updating entries.

## Development checks

```powershell
npm run build
cargo check --locked --manifest-path src-tauri/Cargo.toml
```

The repository currently has no dedicated frontend test command. A successful build verifies compilation; package installation and removal require separate integration testing.
