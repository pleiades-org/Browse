import { getPackage } from "../data/catalog";
import { canInstallPackage, resolveSource, sourceLabel } from "../lib/source";
import type { AppBundle, AppPackage, Platform, QueueItemStatus } from "../types";
import { BrandIcon } from "./BrandIcon";
import { Icon } from "./Icon";

interface BundleDetailProps {
  bundle: AppBundle;
  platform: Platform;
  isInstalled: (id: string) => boolean;
  statusFor: (id: string) => QueueItemStatus | null;
  onBack: () => void;
  onInstallBundle: () => void;
  onQueuePaused: () => void;
  onOpenPackage: (pkg: AppPackage) => void;
}

export function BundleDetail({
  bundle,
  platform,
  isInstalled,
  statusFor,
  onBack,
  onInstallBundle,
  onQueuePaused,
  onOpenPackage,
}: BundleDetailProps) {
  const members = bundle.packageIds
    .map((id) => getPackage(id))
    .filter((p): p is AppPackage => !!p)
    .filter((p) => !p.platforms || p.platforms.includes(platform));

  const installable = members.filter(
    (p) => canInstallPackage(p, platform) && !isInstalled(p.id),
  );

  const preview = members.slice(0, 4);

  return (
    <main className="detail bundle-detail-page">
      <div className="detail-toolbar">
        <button
          type="button"
          className="icon-btn"
          title="Back to bundles"
          aria-label="Back"
          onClick={onBack}
        >
          <Icon name="arrow-left" size={16} />
        </button>
        <span className="detail-crumb muted">Bundles</span>
      </div>

      <div className="bundle-detail-hero">
        <div className="bundle-detail-preview" aria-hidden>
          {Array.from({ length: 4 }).map((_, i) => {
            const pkg = preview[i];
            return (
              <div key={i} className="bundle-preview-cell lg">
                {pkg?.brand ? (
                  <BrandIcon brandKey={pkg.brand} size={32} title={pkg.name} />
                ) : pkg ? (
                  <Icon name="box" size={28} />
                ) : (
                  <span className="bundle-preview-empty" />
                )}
              </div>
            );
          })}
        </div>
        <div className="detail-titles">
          <h1>{bundle.name}</h1>
          <p className="detail-summary">{bundle.summary}</p>
          <div className="pkg-meta detail-meta">
            <span>{members.length} packages</span>
            <span className="dot">·</span>
            <span>{installable.length} to install</span>
            <span className="dot">·</span>
            <span>{platform}</span>
          </div>
        </div>
      </div>

      <div className="detail-actions">
        <button
          type="button"
          className="btn-primary"
          disabled={installable.length === 0}
          onClick={onInstallBundle}
          title="One-click install entire bundle"
        >
          <Icon name="desktop-download" size={16} />
          <span>
            {installable.length === 0
              ? "All installed"
              : `Install bundle (${installable.length})`}
          </span>
        </button>
        <button
          type="button"
          className="btn-secondary"
          disabled={installable.length === 0}
          onClick={onQueuePaused}
          title="Add all to queue paused"
        >
          <Icon name="add" size={16} />
          <span>Queue all</span>
        </button>
      </div>

      <section className="detail-section">
        <h2>What&apos;s included</h2>
        <p className="muted bundle-preview-hint">
          Preview every app in this bundle. Install installs all missing
          packages in one click.
        </p>
        <ul className="bundle-members">
          {members.map((pkg) => {
            const done = isInstalled(pkg.id);
            const st = statusFor(pkg.id);
            const src = resolveSource(pkg, platform);
            const ok = canInstallPackage(pkg, platform);
            return (
              <li key={pkg.id}>
                <button
                  type="button"
                  className="bundle-member"
                  onClick={() => onOpenPackage(pkg)}
                >
                  <span className="bundle-member-left">
                    <span className="bundle-member-icon">
                      {pkg.brand ? (
                        <BrandIcon brandKey={pkg.brand} size={18} />
                      ) : (
                        <Icon name="box" size={16} />
                      )}
                    </span>
                    <span className="bundle-member-name">
                      {pkg.name}
                      {done && (
                        <span className="installed-label"> installed</span>
                      )}
                      {!ok && !done && (
                        <span className="muted"> · unavailable</span>
                      )}
                      {st === "paused" && (
                        <span className="muted"> · paused</span>
                      )}
                      {(st === "installing" || st === "downloading") && (
                        <span className="muted"> · installing</span>
                      )}
                    </span>
                  </span>
                  <span className="muted mono">{sourceLabel(src)}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    </main>
  );
}
