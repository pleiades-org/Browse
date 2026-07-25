import type { Platform } from "./platform";
import type { AppPackage } from "../types";

export type SourceKind =
  | "winget"
  | "brew"
  | "brew-cask"
  | "flatpak"
  | "npm"
  | "pip"
  | "cargo"
  | "github"
  | "web"
  | "other";

export interface ParsedSource {
  kind: SourceKind;
  id: string;
  raw: string;
}

export function parseSource(source: string): ParsedSource {
  const raw = source.trim();
  const idx = raw.indexOf(":");
  if (idx <= 0) return { kind: "other", id: raw, raw };
  const kind = raw.slice(0, idx).toLowerCase() as SourceKind;
  const id = raw.slice(idx + 1);
  const known: SourceKind[] = [
    "winget",
    "brew",
    "brew-cask",
    "flatpak",
    "npm",
    "pip",
    "cargo",
    "github",
    "web",
  ];
  if (known.includes(kind)) return { kind, id, raw };
  return { kind: "other", id: raw, raw };
}

export function sourceLabel(source: string): string {
  const p = parseSource(source);
  switch (p.kind) {
    case "winget":
      return `winget · ${p.id}`;
    case "brew":
      return `brew · ${p.id}`;
    case "brew-cask":
      return `brew cask · ${p.id}`;
    case "flatpak":
      return `flatpak · ${p.id}`;
    case "npm":
      return `npm · ${p.id}`;
    case "pip":
      return `pip · ${p.id}`;
    case "cargo":
      return `cargo · ${p.id}`;
    case "github":
      return `GitHub · ${p.id.split("?")[0]}`;
    case "web":
      return p.id;
    default:
      return source;
  }
}

/** True if we can run a local install command. */
export function isInstallableSource(source: string): boolean {
  const k = parseSource(source).kind;
  return (
    k === "winget" ||
    k === "brew" ||
    k === "brew-cask" ||
    k === "flatpak" ||
    k === "npm" ||
    k === "pip" ||
    k === "github"
  );
}

/**
 * GitHub release installer source.
 * Format: github:owner/repo/Asset.exe@tag?args=/Q:U
 * tag = latest | 0.1.3-RC
 * args = silent flags for the setup exe
 */
export function githubReleaseSource(
  owner: string,
  repo: string,
  asset: string,
  tag: string = "latest",
  args: string = "/Q:U",
): string {
  return `github:${owner}/${repo}/${asset}@${tag}?args=${args}`;
}

/** Pick the best source string for this package on the current OS. */
export function resolveSource(pkg: AppPackage, platform: Platform): string {
  if (pkg.sources?.[platform]) return pkg.sources[platform]!;
  // Fallback: if default source kind matches platform, use it
  const def = pkg.source;
  const kind = parseSource(def).kind;
  if (platform === "windows" && kind === "winget") return def;
  if (platform === "macos" && (kind === "brew" || kind === "brew-cask")) return def;
  if (platform === "linux" && kind === "flatpak") return def;
  if (kind === "npm" || kind === "pip" || kind === "github") return def;
  // Prefer platform-specific if only that exists
  if (pkg.sources) {
    if (platform === "windows" && pkg.sources.windows) return pkg.sources.windows;
    if (platform === "macos" && pkg.sources.macos) return pkg.sources.macos;
    if (platform === "linux" && pkg.sources.linux) return pkg.sources.linux;
  }
  return def;
}

export function isPackageOnPlatform(
  pkg: AppPackage,
  platform: Platform,
): boolean {
  if (pkg.platforms && pkg.platforms.length > 0) {
    return pkg.platforms.includes(platform);
  }
  // If OS-specific sources exist and this OS is missing, hide when no usable fallback
  if (pkg.sources) {
    const hasAny =
      !!pkg.sources.windows || !!pkg.sources.macos || !!pkg.sources.linux;
    if (hasAny && !pkg.sources[platform]) {
      // Still allow npm/pip/cargo cross-platform default source
      const kind = parseSource(pkg.source).kind;
      if (kind === "npm" || kind === "pip" || kind === "cargo") return true;
      if (isInstallableSource(pkg.source)) {
        // e.g. winget-only default on Windows host
        if (platform === "windows" && parseSource(pkg.source).kind === "winget")
          return true;
        if (
          platform === "macos" &&
          (parseSource(pkg.source).kind === "brew" ||
            parseSource(pkg.source).kind === "brew-cask")
        )
          return true;
        if (platform === "linux" && parseSource(pkg.source).kind === "flatpak")
          return true;
      }
      // Hide packages that only define other OS sources
      return false;
    }
  }
  return true;
}

export function canInstallPackage(
  pkg: AppPackage,
  platform: Platform,
): boolean {
  if (pkg.platforms && pkg.platforms.length > 0) {
    if (!pkg.platforms.includes(platform)) return false;
  }
  return isInstallableSource(resolveSource(pkg, platform));
}
