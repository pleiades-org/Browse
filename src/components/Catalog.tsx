import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  CATEGORIES,
  DEFAULT_FILTERS,
  filterCatalog,
  groupByCategory,
  smartSearchHints,
} from "../data/catalog";
import type { Platform } from "../lib/platform";
import type {
  AppPackage,
  CatalogFilters,
  CategoryId,
  QueueItemStatus,
  SortKey,
} from "../types";
import { FeaturedCarousel } from "./FeaturedCarousel";
import { Icon } from "./Icon";
import { PackageCard } from "./PackageCard";

interface CatalogProps {
  category: CategoryId;
  query: string;
  platform: Platform;
  compact: boolean;
  statusFor: (packageId: string) => QueueItemStatus | null;
  isInstalled: (packageId: string) => boolean;
  onOpen: (pkg: AppPackage) => void;
  onDownload: (pkg: AppPackage) => void;
  onQueuePaused: (pkg: AppPackage) => void;
  onCategory: (id: CategoryId) => void;
  focusToken: number;
}

const SORT_OPTIONS: Array<{ id: SortKey; label: string }> = [
  { id: "name-asc", label: "Name A–Z" },
  { id: "name-desc", label: "Name Z–A" },
  { id: "popular", label: "Popular first" },
  { id: "size-asc", label: "Size · small first" },
  { id: "size-desc", label: "Size · large first" },
  { id: "publisher", label: "Publisher" },
];

export function Catalog({
  category,
  query,
  platform,
  compact,
  statusFor,
  isInstalled,
  onOpen,
  onDownload,
  onQueuePaused,
  onCategory,
  focusToken,
}: CatalogProps) {
  const [sort, setSort] = useState<SortKey>("name-asc");
  const [filters, setFilters] = useState<CatalogFilters>(DEFAULT_FILTERS);
  const [menuOpen, setMenuOpen] = useState(false);
  const [focusIndex, setFocusIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const packages = useMemo(
    () => filterCatalog(category, query, filters, sort, platform),
    [category, query, filters, sort, platform],
  );

  const groups = useMemo(() => {
    if (category !== "all" || query.trim()) return null;
    return groupByCategory(packages);
  }, [category, packages, query]);

  /** Flat id list for keyboard nav (matches on-screen order) */
  const flatIds = useMemo(() => {
    if (groups) {
      const ids: string[] = [];
      for (const g of groups) {
        for (const p of g.packages) {
          // popular featured duplicates — use first occurrence only for keyboard
          if (g.category === "popular") ids.push(`featured-${p.id}`);
          else if (!ids.some((x) => x.endsWith(p.id))) ids.push(p.id);
        }
      }
      // Prefer non-featured for keyboard: rebuild without featured prefix first
      const unique: string[] = [];
      const seen = new Set<string>();
      for (const g of groups) {
        if (g.category === "popular") continue;
        for (const p of g.packages) {
          if (!seen.has(p.id)) {
            seen.add(p.id);
            unique.push(p.id);
          }
        }
      }
      // if only popular (edge), fall back
      return unique.length ? unique : packages.map((p) => p.id);
    }
    return packages.map((p) => p.id);
  }, [groups, packages]);

  const label =
    CATEGORIES.find((c) => c.id === category)?.label ?? "All apps";

  const hints = useMemo(() => {
    if (packages.length > 0 || !query.trim()) return null;
    return smartSearchHints(query, 8);
  }, [packages.length, query]);

  const activeFilterCount = [
    filters.popularOnly,
    filters.niniteOnly,
    filters.aiOnly,
    filters.protonOnly,
    filters.smallOnly,
    !filters.installableOnly,
    sort !== "name-asc",
  ].filter(Boolean).length;

  useEffect(() => {
    setFocusIndex(0);
  }, [category, query, filters, sort, focusToken]);

  useEffect(() => {
    if (!menuOpen) return;
    function onDoc(e: MouseEvent) {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const focusedPkg = useMemo(() => {
    const id = flatIds[focusIndex];
    if (!id) return null;
    return packages.find((p) => p.id === id) ?? null;
  }, [flatIds, focusIndex, packages]);

  const onKeyNav = useCallback(
    (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (
        t &&
        (t.tagName === "INPUT" ||
          t.tagName === "TEXTAREA" ||
          t.isContentEditable)
      ) {
        return;
      }
      if (menuOpen) return;
      if (flatIds.length === 0) return;

      if (e.key === "ArrowDown" || e.key === "j") {
        e.preventDefault();
        setFocusIndex((i) => Math.min(flatIds.length - 1, i + 1));
      } else if (e.key === "ArrowUp" || e.key === "k") {
        e.preventDefault();
        setFocusIndex((i) => Math.max(0, i - 1));
      } else if (e.key === "Enter" && focusedPkg) {
        e.preventDefault();
        onOpen(focusedPkg);
      } else if (e.key.toLowerCase() === "i" && focusedPkg) {
        e.preventDefault();
        onDownload(focusedPkg);
      } else if ((e.key === "+" || e.key === "=") && focusedPkg) {
        e.preventDefault();
        onQueuePaused(focusedPkg);
      }
    },
    [flatIds.length, focusedPkg, menuOpen, onDownload, onOpen, onQueuePaused],
  );

  useEffect(() => {
    window.addEventListener("keydown", onKeyNav);
    return () => window.removeEventListener("keydown", onKeyNav);
  }, [onKeyNav]);

  useEffect(() => {
    const id = flatIds[focusIndex];
    if (!id || !listRef.current) return;
    const el = listRef.current.querySelector(
      `[data-pkg-id="${id}"]`,
    ) as HTMLElement | null;
    el?.scrollIntoView({ block: "nearest" });
  }, [focusIndex, flatIds]);

  function toggleFilter(key: keyof CatalogFilters) {
    setFilters((f) => ({ ...f, [key]: !f[key] }));
  }

  function resetFilters() {
    setFilters(DEFAULT_FILTERS);
    setSort("name-asc");
  }

  function renderCard(pkg: AppPackage) {
    return (
      <PackageCard
        key={pkg.id}
        pkg={pkg}
        queueStatus={statusFor(pkg.id)}
        installed={isInstalled(pkg.id)}
        compact={compact}
        selected={flatIds[focusIndex] === pkg.id}
        onOpen={() => onOpen(pkg)}
        onDownload={() => onDownload(pkg)}
        onQueuePaused={() => onQueuePaused(pkg)}
      />
    );
  }

  // Always show featured hero on All apps (even compact). Hide only while searching.
  const showHero = category === "all" && !query.trim();

  return (
    <main className={`catalog ${compact ? "compact" : ""}`} ref={listRef}>
      <div className="catalog-scroll catalog-main-scroll">
        {showHero && (
          <FeaturedCarousel
            platform={platform}
            isInstalled={isInstalled}
            statusFor={statusFor}
            onOpen={onOpen}
            onInstall={onDownload}
          />
        )}

        <div className="catalog-toolbar">
          <div className="catalog-heading">
            <h2>{label}</h2>
            {query && <span className="muted">for “{query}”</span>}
            {filters.niniteOnly && <span className="muted">· Ninite</span>}
          </div>

          <div className="toolbar-meta">
            <span className="result-count" title={`${packages.length} apps`}>
              {packages.length}
            </span>

            <div className="filter-menu-wrap" ref={menuRef}>
              <button
                type="button"
                className={`icon-btn ${menuOpen || activeFilterCount ? "active" : ""}`}
                title="Filters & sort"
                aria-label="Filters and sort"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((v) => !v)}
              >
                <Icon name="list" size={15} />
                {activeFilterCount > 0 && (
                  <span className="badge">{activeFilterCount}</span>
                )}
              </button>

              {menuOpen && (
                <div className="menu-panel filter-panel" role="menu">
                  <div className="menu-section">Sort</div>
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      className={`menu-item ${sort === opt.id ? "selected" : ""}`}
                      role="menuitemradio"
                      aria-checked={sort === opt.id}
                      onClick={() => setSort(opt.id)}
                    >
                      <span className="label">{opt.label}</span>
                      {sort === opt.id && <Icon name="check" size={13} />}
                    </button>
                  ))}
                  <div className="menu-sep" />
                  <div className="menu-section">Filters</div>
                  {(
                    [
                      ["installableOnly", "Installable on this OS"],
                      ["popularOnly", "Popular only"],
                      ["niniteOnly", "Ninite set"],
                      ["aiOnly", "AI tools"],
                      ["protonOnly", "Proton suite"],
                      ["smallOnly", "Under 100 MB"],
                    ] as const
                  ).map(([key, text]) => (
                    <button
                      key={key}
                      type="button"
                      className={`menu-item ${filters[key] ? "selected" : ""}`}
                      role="menuitemcheckbox"
                      aria-checked={filters[key]}
                      onClick={() => toggleFilter(key)}
                    >
                      <span className="label">{text}</span>
                      {filters[key] && <Icon name="check" size={13} />}
                    </button>
                  ))}
                  {activeFilterCount > 0 && (
                    <>
                      <div className="menu-sep" />
                      <button
                        type="button"
                        className="menu-item"
                        onClick={resetFilters}
                      >
                        <span className="label">Reset</span>
                        <Icon name="refresh" size={13} />
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {packages.length === 0 ? (
          <div className="catalog-empty">
            <Icon name="search" size={32} />
            <p>No apps match</p>
            {hints &&
            (hints.packages.length > 0 || hints.categories.length > 0) ? (
              <div className="smart-hints">
                <span className="muted">Did you mean</span>
                {hints.categories.length > 0 && (
                  <div className="hint-row">
                    {hints.categories.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        className="hint-chip"
                        onClick={() => onCategory(c.id)}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                )}
                {hints.packages.length > 0 && (
                  <div className="hint-list">
                    {hints.packages.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        className="hint-item"
                        onClick={() => onOpen(p)}
                      >
                        {p.name}
                        <span className="muted">{p.category}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <span className="muted">
                Try another category, filter, or search
              </span>
            )}
          </div>
        ) : groups ? (
          groups.map((group) => (
            <section
              key={group.category}
              className={`catalog-group ${group.category === "popular" ? "featured" : ""}`}
            >
              <header className="group-header">
                <h3>
                  {group.category === "popular" && (
                    <span className="group-star" aria-hidden>
                      ★{" "}
                    </span>
                  )}
                  {group.label}
                </h3>
                <span className="group-count">{group.packages.length}</span>
              </header>
              <div className={`pkg-grid ${compact ? "compact-grid" : ""}`}>
                {group.packages.map((pkg) => renderCard(pkg))}
              </div>
            </section>
          ))
        ) : (
          <div className={`pkg-grid ${compact ? "compact-grid" : ""}`}>
            {packages.map((pkg) => renderCard(pkg))}
          </div>
        )}
      </div>

      <div className="kb-hint muted" aria-hidden>
        ↑↓ / j k · Enter open · i download · + queue
      </div>
    </main>
  );
}
