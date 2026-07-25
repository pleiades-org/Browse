import type { Platform } from "./lib/platform";

export type { Platform };

export type CategoryId =
  | "all"
  | "popular"
  | "bundles"
  | "proton"
  | "ai"
  | "development"
  | "productivity"
  | "media"
  | "games"
  | "security"
  | "utilities"
  | "internet";

export type QueueItemStatus =
  | "queued"
  | "downloading"
  | "installing"
  | "completed"
  | "failed"
  | "paused"
  | "cancelled";

export interface AppPackage {
  id: string;
  name: string;
  summary: string;
  category: Exclude<CategoryId, "all" | "popular" | "proton" | "bundles">;
  tags?: Array<"proton" | "ai" | "ninite">;
  popular?: boolean;
  version: string;
  sizeMb: number;
  publisher: string;
  /** Default / fallback source id */
  source: string;
  /** OS-specific install sources (override `source` when set) */
  sources?: Partial<Record<Platform, string>>;
  /** If set, only show on these OSes */
  platforms?: Platform[];
  brand?: string;
  /** Local public icon path e.g. `/Pleiades-Chat.svg` (overrides brand glyph when set) */
  icon?: string;
  /** Hero / detail preview image(s) under public/ e.g. `/core-big-preview.png` */
  preview?: string;
  previews?: string[];
}

/** Multi-package install bundle (meta-package). */
export interface AppBundle {
  id: string;
  name: string;
  summary: string;
  /** Sidebar / catalog grouping for the bundles page */
  group: "languages" | "stacks" | "gaming" | "essentials" | "media";
  packageIds: string[];
  platforms?: Platform[];
  brand?: string;
  popular?: boolean;
}

export type SortKey =
  | "name-asc"
  | "name-desc"
  | "size-asc"
  | "size-desc"
  | "popular"
  | "publisher";

export interface CatalogFilters {
  popularOnly: boolean;
  niniteOnly: boolean;
  aiOnly: boolean;
  protonOnly: boolean;
  smallOnly: boolean;
  /** Hide packages that cannot be auto-installed on this OS */
  installableOnly: boolean;
}

export interface QueueItem {
  id: string;
  packageId: string;
  name: string;
  source: string;
  status: QueueItemStatus;
  progress: number;
  sizeMb: number;
  speedMbps: number;
  error?: string;
  addedAt: number;
  /** Bundle that enqueued this item, if any */
  bundleId?: string;
}

export interface Category {
  id: CategoryId;
  label: string;
  icon: string;
}

export interface AppSettings {
  maxConcurrent: number;
  compactMode: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  maxConcurrent: 2,
  compactMode: false,
};

export type ViewMode = "catalog" | "detail" | "bundle-detail" | "settings";
