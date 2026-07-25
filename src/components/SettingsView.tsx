import { platformLabel, type Platform } from "../lib/platform";
import { packageManagerFor } from "../lib/platform";
import type { AppSettings } from "../types";
import { Icon } from "./Icon";

interface SettingsViewProps {
  settings: AppSettings;
  platform: Platform;
  installedCount: number;
  onChange: (patch: Partial<AppSettings>) => void;
  onReset: () => void;
  onForgetAll: () => void;
  onBack: () => void;
}

export function SettingsView({
  settings,
  platform,
  installedCount,
  onChange,
  onReset,
  onForgetAll,
  onBack,
}: SettingsViewProps) {
  return (
    <main className="detail settings-view">
      <div className="detail-toolbar">
        <button
          type="button"
          className="icon-btn"
          title="Back"
          aria-label="Back"
          onClick={onBack}
        >
          <Icon name="arrow-left" size={16} />
        </button>
        <h2 className="settings-title">Settings</h2>
      </div>

      <section className="detail-section">
        <h2>System</h2>
        <div className="settings-row static">
          <div>
            <span className="settings-label">Operating system</span>
            <span className="muted">
              Catalog and package managers adapt to this host
            </span>
          </div>
          <span className="settings-value">
            {platformLabel(platform)} · {packageManagerFor(platform)}
          </span>
        </div>
        <label className="settings-row">
          <div>
            <span className="settings-label">Max concurrent</span>
            <span className="muted">Parallel real installs</span>
          </div>
          <input
            type="number"
            min={1}
            max={6}
            className="settings-num"
            value={settings.maxConcurrent}
            onChange={(e) =>
              onChange({
                maxConcurrent: Math.min(
                  6,
                  Math.max(1, Number(e.target.value) || 1),
                ),
              })
            }
          />
        </label>
      </section>

      <section className="detail-section">
        <h2>Display</h2>
        <label className="settings-row">
          <div>
            <span className="settings-label">Compact icons</span>
            <span className="muted">Icon-only catalog grid</span>
          </div>
          <input
            type="checkbox"
            checked={settings.compactMode}
            onChange={(e) => onChange({ compactMode: e.target.checked })}
          />
        </label>
      </section>

      <section className="detail-section">
        <h2>Installed marks ({installedCount})</h2>
        <p className="muted">
          Marks track completed installs in this app. Uninstall on a package
          detail page also runs the real package manager when possible.
        </p>
        <div className="detail-actions">
          <button
            type="button"
            className="btn-secondary"
            disabled={installedCount === 0}
            onClick={onForgetAll}
          >
            <Icon name="trash" size={15} />
            <span>Forget all installed</span>
          </button>
        </div>
      </section>

      <section className="detail-section">
        <div className="detail-actions">
          <button type="button" className="btn-ghost" onClick={onReset}>
            <Icon name="refresh" size={15} />
            <span>Reset settings</span>
          </button>
        </div>
      </section>
    </main>
  );
}
