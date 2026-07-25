import { useMemo } from "react";
import { BUNDLE_GROUPS, BUNDLES } from "../data/bundles";
import { getPackage } from "../data/catalog";
import { canInstallPackage } from "../lib/source";
import type { AppBundle, AppPackage, Platform } from "../types";
import { BrandIcon } from "./BrandIcon";
import { Icon } from "./Icon";

interface BundleViewProps {
  platform: Platform;
  query: string;
  onOpenBundle: (b: AppBundle) => void;
  onInstallBundle: (b: AppBundle) => void;
}

function memberPackages(b: AppBundle, platform: Platform): AppPackage[] {
  return b.packageIds
    .map((id) => getPackage(id))
    .filter((p): p is AppPackage => !!p)
    .filter((p) => !p.platforms || p.platforms.includes(platform));
}

/** Distinct 2×2 preview card — not an app row. */
function BundleCard({
  bundle,
  platform,
  onOpen,
  onInstall,
}: {
  bundle: AppBundle;
  platform: Platform;
  onOpen: () => void;
  onInstall: () => void;
}) {
  const members = memberPackages(bundle, platform);
  const preview = members.slice(0, 4);
  // pad to 4 slots for consistent grid
  while (preview.length < 4) {
    preview.push(null as unknown as AppPackage);
  }
  const extra = Math.max(0, members.length - 4);
  const installable = members.filter((p) => canInstallPackage(p, platform));

  return (
    <article className="bundle-tile">
      <button
        type="button"
        className="bundle-tile-hit"
        onClick={onOpen}
        aria-label={`Preview ${bundle.name}`}
      >
        <div className="bundle-preview-grid" aria-hidden>
          {preview.map((pkg, i) => (
            <div key={i} className="bundle-preview-cell">
              {pkg?.brand ? (
                <BrandIcon brandKey={pkg.brand} size={28} title={pkg.name} />
              ) : pkg ? (
                <Icon name="box" size={24} />
              ) : (
                <span className="bundle-preview-empty" />
              )}
            </div>
          ))}
          {extra > 0 && (
            <span className="bundle-preview-more">+{extra}</span>
          )}
        </div>
        <div className="bundle-tile-meta">
          <div className="bundle-tile-title-row">
            <h3 className="bundle-tile-name">{bundle.name}</h3>
            {bundle.popular && (
              <Icon name="star" size={12} weight="Filled" />
            )}
          </div>
          <p className="bundle-tile-summary">{bundle.summary}</p>
          <span className="bundle-tile-count">
            {members.length} apps · click to preview
          </span>
        </div>
      </button>
      <button
        type="button"
        className="bundle-install-btn"
        disabled={installable.length === 0}
        onClick={(e) => {
          e.stopPropagation();
          onInstall();
        }}
        title={`Install all ${installable.length} packages`}
      >
        <Icon name="desktop-download" size={15} />
        <span>Install</span>
      </button>
    </article>
  );
}

export function BundleView({
  platform,
  query,
  onOpenBundle,
  onInstallBundle,
}: BundleViewProps) {
  const bundles = useMemo(() => {
    const q = query.trim().toLowerCase();
    return BUNDLES.filter((b) => {
      if (b.platforms && !b.platforms.includes(platform)) return false;
      const pkgs = memberPackages(b, platform);
      if (pkgs.length === 0) return false;
      const anyInstallable = pkgs.some((p) => canInstallPackage(p, platform));
      if (!anyInstallable) return false;
      if (!q) return true;
      return (
        b.name.toLowerCase().includes(q) ||
        b.summary.toLowerCase().includes(q) ||
        b.group.includes(q) ||
        pkgs.some((p) => p.name.toLowerCase().includes(q))
      );
    });
  }, [platform, query]);

  const groups = useMemo(() => {
    return BUNDLE_GROUPS.map((g) => ({
      ...g,
      items: bundles.filter((b) => b.group === g.id),
    })).filter((g) => g.items.length > 0);
  }, [bundles]);

  if (bundles.length === 0) {
    return (
      <main className="catalog">
        <div className="catalog-toolbar">
          <div className="catalog-heading">
            <h2>Bundles</h2>
            <span className="muted">for {platform}</span>
          </div>
        </div>
        <div className="catalog-empty">
          <Icon name="box" size={32} />
          <p>No bundles for this OS</p>
          <span className="muted">
            Bundles filter automatically by operating system
          </span>
        </div>
      </main>
    );
  }

  return (
    <main className="catalog bundle-page">
      <div className="catalog-toolbar">
        <div className="catalog-heading">
          <h2>Bundles</h2>
          <span className="muted">one-click stacks · {platform}</span>
        </div>
        <span className="result-count">{bundles.length}</span>
      </div>

      <div className="catalog-scroll">
        {groups.map((group) => (
          <section key={group.id} className="catalog-group">
            <header className="group-header">
              <h3>{group.label}</h3>
              <span className="group-count">{group.items.length}</span>
            </header>
            <div className="bundle-grid">
              {group.items.map((b) => (
                <BundleCard
                  key={b.id}
                  bundle={b}
                  platform={platform}
                  onOpen={() => onOpenBundle(b)}
                  onInstall={() => onInstallBundle(b)}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
