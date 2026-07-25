import type { AppBundle } from "../types";

/**
 * Bundles = meta packages that install multiple catalog apps.
 * Shown only under the Bundles sidebar category (not mixed into All apps).
 */
export const BUNDLES: AppBundle[] = [
  {
    id: "bundle-rust",
    name: "Rust Bundle",
    summary: "Rust toolchain via rustup, plus Git and VS Code for systems work",
    group: "languages",
    packageIds: ["rustup", "git", "vscode", "github-cli"],
    brand: "rust",
    popular: true,
  },
  {
    id: "bundle-web",
    name: "Web Bundle",
    summary: "Node.js, package managers, Git, and a modern editor for web apps",
    group: "stacks",
    packageIds: ["nodejs", "npm", "pnpm", "git", "vscode", "github-cli"],
    brand: "nodejs",
    popular: true,
  },
  {
    id: "bundle-python",
    name: "Python Bundle",
    summary: "Python 3, uv, pipx, Git, and VS Code",
    group: "languages",
    packageIds: ["python", "uv", "pipx", "git", "vscode"],
    brand: "python",
    popular: true,
  },
  {
    id: "bundle-cpp",
    name: "C++ Bundle",
    summary: "LLVM/Clang-friendly stack: Git, CMake tooling path, VS Code",
    group: "languages",
    packageIds: ["git", "vscode", "github-cli", "cmake"],
    brand: "vscode",
    popular: true,
  },
  {
    id: "bundle-csharp",
    name: "C# / .NET Bundle",
    summary: ".NET Desktop runtime + SDK path packages and Git",
    group: "languages",
    packageIds: ["dotnet-desktop-8", "dotnet-desktop-9", "git", "vscode"],
    brand: "dotnet",
    popular: true,
  },
  {
    id: "bundle-go",
    name: "Go Bundle",
    summary: "Go language, Git, and VS Code",
    group: "languages",
    packageIds: ["go", "git", "vscode", "github-cli"],
    brand: "go",
  },
  {
    id: "bundle-node-pro",
    name: "Node Pro Bundle",
    summary: "Node LTS, npm, pnpm, yarn, bun, and Deno",
    group: "stacks",
    packageIds: ["nodejs", "npm", "pnpm", "yarn", "bun", "deno"],
    brand: "nodejs",
  },
  {
    id: "bundle-ai-dev",
    name: "AI Dev Bundle",
    summary: "Claude Code, Codex CLI, Ollama, and Git for local AI coding",
    group: "stacks",
    packageIds: ["claude-code", "openai-codex", "ollama", "git", "nodejs"],
    brand: "claude",
    popular: true,
  },
  {
    id: "bundle-dev-essentials",
    name: "Dev Essentials",
    summary: "Git, VS Code, Node, Python, 7-Zip, and Windows Terminal helpers",
    group: "essentials",
    packageIds: [
      "git",
      "vscode",
      "nodejs",
      "python",
      "7zip",
      "powertoys",
    ],
    brand: "github",
    popular: true,
    platforms: ["windows"],
  },
  {
    id: "bundle-privacy",
    name: "Privacy Bundle",
    summary: "Proton suite core: Mail, VPN, Pass, and Drive",
    group: "essentials",
    packageIds: ["proton-mail", "proton-vpn", "proton-pass", "proton-drive"],
    brand: "proton",
    popular: true,
  },
  {
    id: "bundle-linux-gaming",
    name: "Linux Gaming Bundle",
    summary: "Steam, Proton-friendly stack, and gaming utilities on Linux",
    group: "gaming",
    packageIds: ["steam", "heroic", "mangohud", "gamemode", "protonup-qt"],
    brand: "steam",
    popular: true,
    platforms: ["linux"],
  },
  {
    id: "bundle-windows-gaming",
    name: "Windows Gaming Bundle",
    summary: "Steam, Epic Games Launcher, and Discord",
    group: "gaming",
    packageIds: ["steam", "epic", "discord"],
    brand: "steam",
    platforms: ["windows"],
  },
  {
    id: "bundle-media",
    name: "Media Bundle",
    summary: "VLC, OBS, Audacity, FFmpeg, and HandBrake",
    group: "media",
    packageIds: ["vlc", "obs", "audacity", "ffmpeg", "handbrake"],
    brand: "vlc",
  },
  {
    id: "bundle-design",
    name: "Design Bundle",
    summary: "GIMP, Inkscape, Krita, and Blender",
    group: "media",
    packageIds: ["gimp", "inkscape", "krita", "blender"],
    brand: "blender",
  },
  {
    id: "bundle-containers",
    name: "Containers Bundle",
    summary: "Docker Desktop, kubectl, and Portainer",
    group: "stacks",
    packageIds: ["docker", "kubernetes", "portainer"],
    brand: "docker",
  },
];

export function getBundle(id: string): AppBundle | undefined {
  return BUNDLES.find((b) => b.id === id);
}

export const BUNDLE_GROUPS: Array<{
  id: AppBundle["group"];
  label: string;
}> = [
  { id: "languages", label: "Languages" },
  { id: "stacks", label: "Stacks" },
  { id: "essentials", label: "Essentials" },
  { id: "gaming", label: "Gaming" },
  { id: "media", label: "Media & creative" },
];
