export type Platform = "windows" | "macos" | "linux";

/** Detect host OS (Tauri WebView / browser). */
export function detectPlatform(): Platform {
  // userAgentData is Chromium; fallback to platform / UA
  const uaData = (
    navigator as Navigator & {
      userAgentData?: { platform?: string };
    }
  ).userAgentData?.platform;
  const p = `${uaData ?? ""} ${navigator.platform ?? ""} ${navigator.userAgent ?? ""}`;

  // WebView2 / Windows first — most Browse users
  if (/Win32|Win64|Windows|Win/i.test(p)) return "windows";
  if (/Mac|Macintosh|MacIntel|MacOS/i.test(p)) return "macos";
  if (/Linux|X11|Wayland|CrOS/i.test(p)) return "linux";
  // Default to Windows for this desktop app when unknown
  return "windows";
}

export function platformLabel(p: Platform): string {
  switch (p) {
    case "windows":
      return "Windows";
    case "macos":
      return "macOS";
    case "linux":
      return "Linux";
  }
}

/** Preferred package manager id for this OS. */
export function packageManagerFor(p: Platform): string {
  switch (p) {
    case "windows":
      return "winget";
    case "macos":
      return "homebrew";
    case "linux":
      return "flatpak / distro";
  }
}
