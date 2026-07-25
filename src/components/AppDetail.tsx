import { openUrl } from "@tauri-apps/plugin-opener";
import { uninstallPackage } from "../lib/install";
import type { Platform } from "../lib/platform";
import {
  canInstallPackage,
  resolveSource,
  sourceLabel,
} from "../lib/source";
import type { AppPackage, QueueItemStatus } from "../types";
import { AppIcon, useAppIconFill } from "./AppIcon";
import { Icon } from "./Icon";

interface AppDetailProps {
  pkg: AppPackage;
  platform: Platform;
  installed: boolean;
  queueStatus: QueueItemStatus | null;
  onBack: () => void;
  onDownload: () => void;
  onQueuePaused: () => void;
  onForget: () => void;
  onUninstalled: () => void;
}

export function AppDetail({
  pkg,
  platform,
  installed,
  queueStatus,
  onBack,
  onDownload,
  onQueuePaused,
  onForget,
  onUninstalled,
}: AppDetailProps) {
  const brandFill = useAppIconFill(pkg);
  const source = resolveSource(pkg, platform);
  const busy =
    queueStatus === "queued" ||
    queueStatus === "downloading" ||
    queueStatus === "installing" ||
    queueStatus === "paused";
  const justCompleted = queueStatus === "completed";
  const done = installed || justCompleted;
  const canInstall = canInstallPackage(pkg, platform);
  // Detail page always allows another install attempt (repair / reinstall)
  const canAttemptInstall = canInstall && !busy;
  const canQueue = canAttemptInstall;
  const previews =
    pkg.previews?.length ? pkg.previews : pkg.preview ? [pkg.preview] : [];

  async function openHome() {
    let url = "https://github.com";
    if (source.startsWith("web:")) {
      const rest = source.slice(4);
      url = rest.startsWith("http") ? rest : `https://${rest}`;
    } else if (source.startsWith("github:")) {
      // github:owner/repo/Asset@tag?...
      const rest = source.slice("github:".length).split("?")[0];
      const parts = rest.split("/");
      const owner = parts[0];
      const repo = parts[1];
      if (owner && repo) {
        url = `https://github.com/${owner}/${repo}/releases/latest`;
      }
    } else if (source.startsWith("winget:")) {
      url = `https://winget.run/pkg/${source.slice(7)}`;
    } else if (source.startsWith("npm:")) {
      url = `https://www.npmjs.com/package/${source.slice(4)}`;
    } else if (source.startsWith("brew:") || source.startsWith("brew-cask:")) {
      const id = source.includes("cask:")
        ? source.slice("brew-cask:".length)
        : source.slice("brew:".length);
      url = `https://formulae.brew.sh/formula/${id}`;
    } else if (source.startsWith("flatpak:")) {
      url = `https://flathub.org/apps/${source.slice(8)}`;
    }
    try {
      await openUrl(url);
    } catch {
      window.open(url, "_blank");
    }
  }

  async function handleUninstall() {
    await uninstallPackage(source);
    onForget();
    onUninstalled();
  }

  return (
    <main className="detail">
      <div className="detail-toolbar">
        <button
          type="button"
          className="icon-btn"
          title="Back"
          aria-label="Back to catalog"
          onClick={onBack}
        >
          <Icon name="arrow-left" size={16} />
        </button>
        <span className="detail-crumb muted">{pkg.category}</span>
      </div>

      <div className="detail-hero">
        <div
          className="detail-icon"
          style={
            brandFill
              ? {
                  background: `color-mix(in srgb, ${brandFill} 14%, var(--color-surface))`,
                  borderColor: `color-mix(in srgb, ${brandFill} 28%, var(--color-border))`,
                }
              : undefined
          }
        >
          <AppIcon pkg={pkg} size={40} />
        </div>
        <div className="detail-titles">
          <h1>{pkg.name}</h1>
          <p className="detail-publisher">{pkg.publisher}</p>
          <p className="detail-summary">{pkg.summary}</p>
          <div className="pkg-meta detail-meta">
            <span>v{pkg.version}</span>
            <span className="dot">·</span>
            <span>{pkg.sizeMb} MB</span>
            <span className="dot">·</span>
            <span title={source}>{sourceLabel(source)}</span>
            <span className="dot">·</span>
            <span>{platform}</span>
            {done && (
              <>
                <span className="dot">·</span>
                <span className="installed-label">installed</span>
              </>
            )}
          </div>
        </div>
      </div>

      {previews.length > 0 && (
        <div className="detail-previews" aria-label="Screenshots">
          {previews.map((src) => (
            <img
              key={src}
              src={src}
              alt=""
              className="detail-preview-img"
              draggable={false}
            />
          ))}
        </div>
      )}

      <div className="detail-actions">
        <button
          type="button"
          className={`btn-primary ${done && !busy ? "done" : ""}`}
          disabled={!canAttemptInstall}
          onClick={onDownload}
          title={
            !canInstall
              ? "No installer for this OS"
              : busy
                ? "Already in queue"
                : done
                  ? "Install again (repair / reinstall)"
                  : "Download and install"
          }
        >
          <Icon name={busy ? "download" : "desktop-download"} size={16} />
          <span>
            {!canInstall
              ? "Unavailable"
              : busy
                ? "In queue"
                : done
                  ? "Reinstall"
                  : "Download"}
          </span>
        </button>
        <button
          type="button"
          className="btn-secondary"
          disabled={!canQueue}
          onClick={onQueuePaused}
          title={
            done
              ? "Queue another install (paused)"
              : "Add paused to download queue"
          }
        >
          <Icon name="add" size={16} />
          <span>Queue</span>
        </button>
        <button
          type="button"
          className="btn-ghost"
          onClick={() => void openHome()}
          title="Open homepage / source"
        >
          <Icon name="external" size={15} />
          <span>Open</span>
        </button>
        {done && (
          <>
            <button
              type="button"
              className="btn-ghost"
              onClick={onForget}
              title="Forget installed mark (local only)"
            >
              <Icon name="close" size={15} />
              <span>Forget</span>
            </button>
            <button
              type="button"
              className="btn-ghost danger"
              onClick={() => void handleUninstall()}
              title="Uninstall via package manager"
            >
              <Icon name="trash" size={15} />
              <span>Uninstall</span>
            </button>
          </>
        )}
      </div>

      <section className="detail-section">
        <h2>About</h2>
        <p>
          {pkg.summary}. Installs via{" "}
          <code className="inline-code">{sourceLabel(source)}</code> on{" "}
          {platform}.
          {!canInstall &&
            " This package has no automated installer on your OS."}
        </p>
      </section>

      <section className="detail-section">
        <h2>Details</h2>
        <dl className="detail-dl">
          <div>
            <dt>Category</dt>
            <dd>{pkg.category}</dd>
          </div>
          <div>
            <dt>Publisher</dt>
            <dd>{pkg.publisher}</dd>
          </div>
          <div>
            <dt>Version</dt>
            <dd>{pkg.version}</dd>
          </div>
          <div>
            <dt>Source</dt>
            <dd>
              <code className="inline-code">{source}</code>
            </dd>
          </div>
        </dl>
      </section>
    </main>
  );
}
