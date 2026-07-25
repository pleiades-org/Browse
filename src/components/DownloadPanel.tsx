import type { QueueItem } from "../types";
import { Icon } from "./Icon";

interface DownloadPanelProps {
  open: boolean;
  queue: QueueItem[];
  hasPausable: boolean;
  hasResumable: boolean;
  onClose: () => void;
  onPause: (id: string) => void;
  onResume: (id: string) => void;
  onPauseAll: () => void;
  onResumeAll: () => void;
  onCancel: (id: string) => void;
  onRemove: (id: string) => void;
  onClearFinished: () => void;
  onClearAll: () => void;
}

function formatSpeed(mbps: number): string {
  if (mbps <= 0) return "";
  if (mbps < 1) return `${Math.round(mbps * 1024)} KB/s`;
  return `${mbps.toFixed(1)} MB/s`;
}

function statusHint(item: QueueItem): string {
  switch (item.status) {
    case "queued":
      return "Waiting";
    case "downloading":
      return formatSpeed(item.speedMbps) || "Downloading";
    case "installing":
      return "Installing…";
    case "completed":
      return "Done";
    case "paused":
      return "Paused";
    case "failed":
      return item.error || "Failed";
    case "cancelled":
      return "Cancelled";
    default:
      return "";
  }
}

export function DownloadPanel({
  open,
  queue,
  hasPausable,
  hasResumable,
  onClose,
  onPause,
  onResume,
  onPauseAll,
  onResumeAll,
  onCancel,
  onRemove,
  onClearFinished,
  onClearAll,
}: DownloadPanelProps) {
  if (!open) return null;

  const hasFinished = queue.some(
    (i) =>
      i.status === "completed" ||
      i.status === "cancelled" ||
      i.status === "failed",
  );

  const sorted = [...queue].sort((a, b) => b.addedAt - a.addedAt);

  return (
    <aside className="queue-panel" aria-label="Download manager">
      <div className="queue-header">
        <div className="queue-title">
          <Icon name="cloud-download" size={15} />
          <span>Queue</span>
          {queue.length > 0 && (
            <span className="queue-count">{queue.length}</span>
          )}
        </div>
        <div className="queue-header-actions">
          {hasPausable && (
            <button
              type="button"
              className="icon-btn"
              title="Pause all"
              aria-label="Pause all downloads"
              onClick={onPauseAll}
            >
              <Icon name="pause" size={14} />
            </button>
          )}
          {hasResumable && (
            <button
              type="button"
              className="icon-btn"
              title="Resume all"
              aria-label="Resume all downloads"
              onClick={onResumeAll}
            >
              <Icon name="play" size={14} />
            </button>
          )}
          {hasFinished && (
            <button
              type="button"
              className="icon-btn"
              title="Clear finished"
              aria-label="Clear finished"
              onClick={onClearFinished}
            >
              <Icon name="check" size={14} />
            </button>
          )}
          {queue.length > 0 && (
            <button
              type="button"
              className="icon-btn danger"
              title="Clear all"
              aria-label="Clear entire queue"
              onClick={onClearAll}
            >
              <Icon name="trash" size={14} />
            </button>
          )}
          <button
            type="button"
            className="icon-btn"
            title="Close queue"
            aria-label="Close queue"
            onClick={onClose}
          >
            <Icon name="close" size={14} />
          </button>
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="queue-empty">
          <Icon name="download" size={28} />
          <p>No downloads</p>
          <span>Download or + to queue apps</span>
        </div>
      ) : (
        <ul className="queue-list">
          {sorted.map((item) => (
            <li key={item.id} className={`queue-item status-${item.status}`}>
              <div className="queue-item-top">
                <div className="queue-item-info">
                  <span className="queue-item-name" title={item.name}>
                    {item.name}
                  </span>
                  <span className="queue-item-hint">{statusHint(item)}</span>
                </div>
                <div className="queue-item-actions">
                  {(item.status === "downloading" ||
                    item.status === "queued" ||
                    item.status === "installing") && (
                    <button
                      type="button"
                      className="icon-btn"
                      title="Pause"
                      aria-label={`Pause ${item.name}`}
                      onClick={() => onPause(item.id)}
                    >
                      <Icon name="pause" size={13} />
                    </button>
                  )}
                  {item.status === "paused" && (
                    <button
                      type="button"
                      className="icon-btn"
                      title="Resume"
                      aria-label={`Resume ${item.name}`}
                      onClick={() => onResume(item.id)}
                    >
                      <Icon name="play" size={13} />
                    </button>
                  )}
                  {item.status !== "completed" &&
                    item.status !== "cancelled" &&
                    item.status !== "failed" && (
                      <button
                        type="button"
                        className="icon-btn danger"
                        title="Cancel"
                        aria-label={`Cancel ${item.name}`}
                        onClick={() => onCancel(item.id)}
                      >
                        <Icon name="close" size={13} />
                      </button>
                    )}
                  {(item.status === "completed" ||
                    item.status === "cancelled" ||
                    item.status === "failed") && (
                    <button
                      type="button"
                      className="icon-btn"
                      title="Remove"
                      aria-label={`Remove ${item.name}`}
                      onClick={() => onRemove(item.id)}
                    >
                      <Icon name="trash" size={13} />
                    </button>
                  )}
                </div>
              </div>
              {(item.status === "downloading" ||
                item.status === "installing" ||
                item.status === "paused" ||
                item.status === "queued") && (
                <div
                  className="progress-track"
                  title={`${Math.round(item.progress)}%`}
                >
                  <div
                    className="progress-fill"
                    style={{ width: `${Math.min(100, item.progress)}%` }}
                  />
                </div>
              )}
              {item.status === "completed" && (
                <div className="progress-track done">
                  <div className="progress-fill" style={{ width: "100%" }} />
                </div>
              )}
              {item.status === "failed" && item.error && (
                <p className="queue-error" title={item.error}>
                  {item.error}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
