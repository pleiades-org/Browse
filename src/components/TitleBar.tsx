import type { RefObject } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { Icon } from "./Icon";

interface TitleBarProps {
  sidebarOpen: boolean;
  queueOpen: boolean;
  activeDownloads: number;
  query: string;
  onQuery: (q: string) => void;
  searchRef: RefObject<HTMLInputElement | null>;
  onToggleSidebar: () => void;
  onToggleQueue: () => void;
  compactMode: boolean;
  onToggleCompact: () => void;
}

export function TitleBar({
  sidebarOpen,
  queueOpen,
  activeDownloads,
  query,
  onQuery,
  searchRef,
  onToggleSidebar,
  onToggleQueue,
  compactMode,
  onToggleCompact,
}: TitleBarProps) {
  async function minimize() {
    try {
      await getCurrentWindow().minimize();
    } catch {
      /* browser preview */
    }
  }
  async function toggleMaximize() {
    try {
      await getCurrentWindow().toggleMaximize();
    } catch {
      /* browser preview */
    }
  }
  async function closeWin() {
    try {
      await getCurrentWindow().close();
    } catch {
      /* browser preview */
    }
  }

  return (
    <header className="titlebar">
      <div className="drag-layer" data-tauri-drag-region />

      <div className="leading">
        <button
          type="button"
          className={`icon-btn ${sidebarOpen ? "active" : ""}`}
          title="Toggle sidebar (Ctrl+\\)"
          aria-label="Toggle sidebar"
          onClick={onToggleSidebar}
        >
          <Icon name="sidebar" size={15} />
        </button>
      </div>

      <div className="center">
        <div className="drag-fill drag-fill-start" data-tauri-drag-region />
        <div
          className="titlebar-search"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <Icon name="search" size={13} />
          <input
            ref={searchRef}
            type="search"
            className="search-input"
            placeholder="Search apps…"
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            aria-label="Search apps"
          />
          {query && (
            <button
              type="button"
              className="icon-btn search-clear"
              title="Clear search"
              aria-label="Clear search"
              onClick={() => onQuery("")}
            >
              <Icon name="close" size={12} />
            </button>
          )}
        </div>
        <div className="drag-fill" data-tauri-drag-region />
      </div>

      <div className="trailing">
        <button
          type="button"
          className={`icon-btn ${compactMode ? "active" : ""}`}
          title="Compact icon mode"
          aria-label="Toggle compact mode"
          aria-pressed={compactMode}
          onClick={onToggleCompact}
        >
          <Icon name="grid" size={15} />
        </button>
        <button
          type="button"
          className={`icon-btn queue-btn ${queueOpen ? "active" : ""}`}
          title="Download queue (Ctrl+J)"
          aria-label="Download queue"
          onClick={onToggleQueue}
        >
          <Icon name="download" size={15} />
          {activeDownloads > 0 && (
            <span className="badge">
              {activeDownloads > 9 ? "9+" : activeDownloads}
            </span>
          )}
        </button>
        <div className="win-controls">
          <button type="button" className="win-btn" aria-label="Minimize" onClick={minimize}>
            <Icon name="minimize" size={12} />
          </button>
          <button type="button" className="win-btn" aria-label="Maximize" onClick={toggleMaximize}>
            <Icon name="maximize" size={12} />
          </button>
          <button type="button" className="win-btn close" aria-label="Close" onClick={closeWin}>
            <Icon name="close" size={12} />
          </button>
        </div>
      </div>
    </header>
  );
}
