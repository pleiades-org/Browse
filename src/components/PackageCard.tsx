import type { AppPackage, QueueItemStatus } from "../types";
import { AppIcon, useAppIconFill } from "./AppIcon";
import { Icon } from "./Icon";
import { Tooltip } from "./Tooltip";

interface PackageCardProps {
  pkg: AppPackage;
  queueStatus: QueueItemStatus | null;
  installed: boolean;
  compact?: boolean;
  selected?: boolean;
  onOpen: () => void;
  onDownload: () => void;
  onQueuePaused: () => void;
}

export function PackageCard({
  pkg,
  queueStatus,
  installed,
  compact,
  selected,
  onOpen,
  onDownload,
  onQueuePaused,
}: PackageCardProps) {
  const brandFill = useAppIconFill(pkg);
  const hasMark = Boolean(pkg.icon || pkg.brand);
  const busy =
    !installed &&
    (queueStatus === "queued" ||
      queueStatus === "downloading" ||
      queueStatus === "installing" ||
      queueStatus === "paused");
  const done = installed || queueStatus === "completed";
  const canQueue = !done && !busy;

  if (compact) {
    return (
      <Tooltip label={pkg.name} side="bottom" delayMs={0} className="pkg-compact-tip">
        <button
          type="button"
          className={`pkg-compact ${selected ? "selected" : ""} ${done ? "is-installed" : ""}`}
          data-pkg-id={pkg.id}
          aria-label={pkg.name}
          onClick={onOpen}
        >
          <span
            className={`pkg-icon ${hasMark ? "has-brand" : ""}`}
            style={
              brandFill
                ? {
                    background: `color-mix(in srgb, ${brandFill} 12%, var(--color-surface))`,
                    borderColor: `color-mix(in srgb, ${brandFill} 22%, var(--color-border))`,
                  }
                : undefined
            }
          >
            <AppIcon pkg={pkg} size={22} />
          </span>
          {done && (
            <span className="compact-check" aria-hidden>
              <Icon name="check" size={10} />
            </span>
          )}
        </button>
      </Tooltip>
    );
  }

  return (
    <article
      className={`pkg-card ${done ? "is-installed" : ""} ${selected ? "selected" : ""}`}
      data-pkg-id={pkg.id}
    >
      <button
        type="button"
        className="pkg-main"
        onClick={onOpen}
        aria-label={`Open ${pkg.name}`}
      >
        <div
          className={`pkg-icon ${hasMark ? "has-brand" : ""}`}
          style={
            brandFill
              ? {
                  background: `color-mix(in srgb, ${brandFill} 12%, var(--color-surface))`,
                  borderColor: `color-mix(in srgb, ${brandFill} 22%, var(--color-border))`,
                }
              : undefined
          }
        >
          <AppIcon pkg={pkg} size={22} />
        </div>
        <div className="pkg-body">
          <div className="pkg-title-row">
            <h3 className="pkg-name">{pkg.name}</h3>
            {pkg.popular && (
              <span className="pkg-badge" title="Popular">
                <Icon name="star" size={11} weight="Filled" />
              </span>
            )}
          </div>
          <p className="pkg-summary">{pkg.summary}</p>
          <div className="pkg-meta">
            <span>v{pkg.version}</span>
            <span className="dot">·</span>
            <span>{pkg.sizeMb} MB</span>
            {done && (
              <>
                <span className="dot">·</span>
                <span className="installed-label">installed</span>
              </>
            )}
            {queueStatus === "paused" && (
              <>
                <span className="dot">·</span>
                <span>queued · paused</span>
              </>
            )}
          </div>
        </div>
      </button>

      <div className="pkg-actions">
        <button
          type="button"
          className={`icon-btn install-btn ${done ? "done" : ""} ${busy ? "busy" : ""}`}
          title={done ? "Installed" : busy ? "In queue" : "Download / install"}
          aria-label={
            done ? `${pkg.name} installed` : `Download ${pkg.name}`
          }
          disabled={done || busy}
          onClick={(e) => {
            e.stopPropagation();
            if (!done && !busy) onDownload();
          }}
        >
          {done ? (
            <Icon name="check" size={16} />
          ) : busy ? (
            <Icon name="download" size={16} />
          ) : (
            <Icon name="desktop-download" size={16} />
          )}
        </button>
        <button
          type="button"
          className="icon-btn"
          title="Add to queue paused"
          aria-label={`Add ${pkg.name} to queue paused`}
          disabled={!canQueue}
          onClick={(e) => {
            e.stopPropagation();
            if (canQueue) onQueuePaused();
          }}
        >
          <Icon name="add" size={16} />
        </button>
      </div>
    </article>
  );
}
