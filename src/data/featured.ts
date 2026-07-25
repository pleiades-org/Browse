import { githubReleaseSource } from "../lib/source";
import type { AppPackage, Platform } from "../types";

export interface FeaturedSlide {
  id: string;
  /** Headline on the hero */
  title: string;
  /** Short pitch */
  subtitle: string;
  /** Badge text e.g. Featured */
  badge?: string;
  /** Accent gradient end color */
  accent?: string;
  /** Catalog package id this slide installs */
  packageId: string;
  platforms?: Platform[];
  /** Override preview art (defaults to package.preview) */
  preview?: string;
  /** Shown in hero meta (e.g. silent -Silent) */
  silentHint?: string;
}

/**
 * Core Launcher — GitHub release install, silent by default.
 * Release: https://github.com/pleiades-org/Core/releases
 * Asset: CoreLauncherSetup.exe
 * Silent: /Q:U  (no dialog, no app launch)
 * Tag: latest resolves via GitHub API releases/latest
 * Pinned RC also available: 0.1.3-RC
 */
export const CORE_LAUNCHER_SOURCE = githubReleaseSource(
  "pleiades-org",
  "Core",
  "CoreLauncherSetup.exe",
  "latest",
  "/Q:U",
);

/** Explicit tag used when latest is not yet published as “latest” */
export const CORE_LAUNCHER_SOURCE_RC = githubReleaseSource(
  "pleiades-org",
  "Core",
  "CoreLauncherSetup.exe",
  "0.1.3-RC",
  "/Q:U",
);

/**
 * Pleiades Chat — GitHub release install.
 * Release: https://github.com/RobertTGreat/Pleiades/releases/latest
 * Asset: Pleiades.Chat_*_x64-setup.exe (versioned)
 * Silent: -Silent  (also /Silent, /S)
 */
export const PLEIADES_CHAT_SOURCE = githubReleaseSource(
  "RobertTGreat",
  "Pleiades",
  "Pleiades.Chat_*_x64-setup.exe",
  "latest",
  "-Silent",
);

export const CORE_LAUNCHER_PACKAGE: AppPackage = {
  id: "core-launcher",
  name: "Core Launcher",
  summary:
    "Pleiades Core launcher — hotkey reveal, onboarding, and desktop control",
  category: "utilities",
  popular: true,
  version: "0.1.3-RC",
  sizeMb: 7,
  publisher: "Pleiades",
  source: CORE_LAUNCHER_SOURCE,
  sources: {
    windows: CORE_LAUNCHER_SOURCE_RC,
  },
  platforms: ["windows"],
  icon: "/Pleiades-Core.svg",
  preview: "/core-big-preview.png",
};

export const PLEIADES_CHAT_PACKAGE: AppPackage = {
  id: "pleiades-chat",
  name: "Pleiades Chat",
  summary:
    "Desktop social + chat — feed, servers, voice, posts (aligned with the web app)",
  category: "internet",
  popular: true,
  version: "0.1.2",
  sizeMb: 8,
  publisher: "Pleiades",
  source: PLEIADES_CHAT_SOURCE,
  sources: {
    windows: PLEIADES_CHAT_SOURCE,
  },
  platforms: ["windows"],
  icon: "/Pleiades-Chat.svg",
  preview: "/Chat-Tweet.png",
  previews: ["/Chat-Tweet.png", "/Chat-Profile.png", "/Chat-Server.png"],
};

export const FEATURED_SLIDES: FeaturedSlide[] = [
  {
    id: "feat-core",
    title: "Core Launcher",
    subtitle:
      "Silent install from GitHub Releases. Hotkey desktop control for Pleiades Core.",
    badge: "Featured",
    accent: "#a78bfa",
    packageId: "core-launcher",
    platforms: ["windows"],
    preview: "/core-big-preview.png",
    silentHint: "silent /Q:U",
  },
  {
    id: "feat-pleiades-chat",
    title: "Pleiades Chat",
    subtitle:
      "Desktop parity with the web app. Silent install from GitHub Releases.",
    badge: "New",
    accent: "#818cf8",
    packageId: "pleiades-chat",
    platforms: ["windows"],
    preview: "/Chat-Tweet.png",
    silentHint: "silent -Silent",
  },
];

/** Featured slides for the All-apps hero. Always returned (install is OS-gated in UI). */
export function getFeaturedSlides(_platform?: Platform): FeaturedSlide[] {
  return FEATURED_SLIDES;
}
