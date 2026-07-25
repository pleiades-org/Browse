import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppDetail } from "./components/AppDetail";
import { BundleDetail } from "./components/BundleDetail";
import { BundleView } from "./components/BundleView";
import { Catalog } from "./components/Catalog";
import { DownloadPanel } from "./components/DownloadPanel";
import { SettingsView } from "./components/SettingsView";
import { Sidebar } from "./components/Sidebar";
import { TitleBar } from "./components/TitleBar";
import { getPackage } from "./data/catalog";
import { useAppMemory } from "./hooks/useAppMemory";
import { useDownloadQueue } from "./hooks/useDownloadQueue";
import { useSettings } from "./hooks/useSettings";
import { detectHostOs } from "./lib/install";
import { detectPlatform, type Platform } from "./lib/platform";
import { canInstallPackage } from "./lib/source";
import type { AppBundle, AppPackage, CategoryId, ViewMode } from "./types";
import "./App.css";

function App() {
  const { memory, setMemory } = useAppMemory();
  const [sidebarOpen, setSidebarOpen] = useState(() => memory.sidebarOpen);
  const [queueOpen, setQueueOpen] = useState(false);
  const [category, setCategory] = useState<CategoryId>(() => memory.category);
  const [query, setQuery] = useState("");
  const [view, setView] = useState<ViewMode>("catalog");
  const [detailPkg, setDetailPkg] = useState<AppPackage | null>(null);
  const [detailBundle, setDetailBundle] = useState<AppBundle | null>(null);
  const [focusToken, setFocusToken] = useState(0);
  const [platform, setPlatform] = useState<Platform>(() => detectPlatform());
  const searchRef = useRef<HTMLInputElement>(null);

  const { settings, setSettings, resetSettings } = useSettings();

  // Keep UI memory in sync (category + sidebar survive restarts)
  useEffect(() => {
    setMemory({ category, sidebarOpen });
  }, [category, sidebarOpen, setMemory]);

  const {
    queue,
    enqueue,
    enqueueMany,
    pause,
    resume,
    pauseAll,
    resumeAll,
    cancel,
    remove,
    clearFinished,
    clearAll,
    statusFor,
    isInstalled,
    forgetInstalled,
    forgetAllInstalled,
    activeCount,
    overallProgress,
    hasPausable,
    hasResumable,
    installedIds,
  } = useDownloadQueue({
    maxConcurrent: settings.maxConcurrent,
    platform,
  });

  useEffect(() => {
    void detectHostOs().then((os) => {
      if (os === "windows") setPlatform("windows");
      else if (os === "macos") setPlatform("macos");
      else if (os === "linux") setPlatform("linux");
    });
  }, []);

  const focusSearch = useCallback(() => {
    searchRef.current?.focus();
    searchRef.current?.select();
  }, []);

  const openDetail = useCallback((pkg: AppPackage) => {
    setDetailPkg(pkg);
    setDetailBundle(null);
    setView("detail");
  }, []);

  const openBundle = useCallback((b: AppBundle) => {
    setDetailBundle(b);
    setDetailPkg(null);
    setView("bundle-detail");
  }, []);

  const onDownload = useCallback(
    (pkg: AppPackage, opts?: { force?: boolean }) => {
      if (!opts?.force && isInstalled(pkg.id)) return;
      if (!canInstallPackage(pkg, platform)) return;
      enqueue(pkg, { force: opts?.force });
      setQueueOpen(true);
    },
    [enqueue, isInstalled, platform],
  );

  const onQueuePaused = useCallback(
    (pkg: AppPackage, opts?: { force?: boolean }) => {
      if (!opts?.force && isInstalled(pkg.id)) return;
      if (!canInstallPackage(pkg, platform)) return;
      enqueue(pkg, { paused: true, force: opts?.force });
      setQueueOpen(true);
    },
    [enqueue, isInstalled, platform],
  );

  const installBundle = useCallback(
    (b: AppBundle, paused = false) => {
      const pkgs = b.packageIds
        .map((id) => getPackage(id))
        .filter((p): p is AppPackage => !!p)
        .filter((p) => canInstallPackage(p, platform) && !isInstalled(p.id));
      enqueueMany(pkgs, { paused, bundleId: b.id });
      setQueueOpen(true);
    },
    [enqueueMany, isInstalled, platform],
  );

  const goCatalog = useCallback(() => {
    setView("catalog");
    setDetailPkg(null);
    setDetailBundle(null);
    setFocusToken((t) => t + 1);
  }, []);

  const onCategory = useCallback((id: CategoryId) => {
    setCategory(id);
    setView("catalog");
    setDetailPkg(null);
    setDetailBundle(null);
  }, []);

  const osBadge = useMemo(() => platform, [platform]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", "dark");
    document.documentElement.setAttribute("data-os", platform);

    function onKey(e: KeyboardEvent) {
      const mod = e.ctrlKey || e.metaKey;
      const t = e.target as HTMLElement | null;
      const inField =
        t &&
        (t.tagName === "INPUT" ||
          t.tagName === "TEXTAREA" ||
          t.isContentEditable);

      if (mod && e.key.toLowerCase() === "k") {
        e.preventDefault();
        focusSearch();
        return;
      }
      if (mod && e.key === "\\") {
        e.preventDefault();
        setSidebarOpen((v) => !v);
        return;
      }
      if (mod && e.key.toLowerCase() === "j") {
        e.preventDefault();
        setQueueOpen((v) => !v);
        return;
      }
      if (mod && e.key === ",") {
        e.preventDefault();
        setView("settings");
        setDetailPkg(null);
        setDetailBundle(null);
        return;
      }
      if (e.key === "Escape") {
        if (inField && query) {
          setQuery("");
          return;
        }
        if (
          view === "detail" ||
          view === "settings" ||
          view === "bundle-detail"
        ) {
          e.preventDefault();
          goCatalog();
          return;
        }
        if (queueOpen) setQueueOpen(false);
      }
      if (
        e.key === "Backspace" &&
        !inField &&
        (view === "detail" || view === "bundle-detail")
      ) {
        e.preventDefault();
        goCatalog();
      }
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [focusSearch, goCatalog, platform, query, queueOpen, view]);

  return (
    <div className="shell" data-os={osBadge}>
      <TitleBar
        sidebarOpen={sidebarOpen}
        queueOpen={queueOpen}
        activeDownloads={activeCount}
        query={query}
        onQuery={setQuery}
        searchRef={searchRef}
        onToggleSidebar={() => setSidebarOpen((v) => !v)}
        onToggleQueue={() => setQueueOpen((v) => !v)}
        compactMode={settings.compactMode}
        onToggleCompact={() =>
          setSettings({ compactMode: !settings.compactMode })
        }
      />
      <div className="body">
        <Sidebar
          open={sidebarOpen}
          category={category}
          onCategory={onCategory}
          queueOpen={queueOpen}
          activeDownloads={activeCount}
          overallProgress={overallProgress}
          onToggleQueue={() => setQueueOpen((v) => !v)}
          onOpenSettings={() => {
            setView("settings");
            setDetailPkg(null);
            setDetailBundle(null);
          }}
          settingsActive={view === "settings"}
        />

        {view === "settings" ? (
          <SettingsView
            settings={settings}
            platform={platform}
            installedCount={installedIds.size}
            onChange={setSettings}
            onReset={resetSettings}
            onForgetAll={forgetAllInstalled}
            onBack={goCatalog}
          />
        ) : view === "bundle-detail" && detailBundle ? (
          <BundleDetail
            bundle={detailBundle}
            platform={platform}
            isInstalled={isInstalled}
            statusFor={statusFor}
            onBack={goCatalog}
            onInstallBundle={() => installBundle(detailBundle, false)}
            onQueuePaused={() => installBundle(detailBundle, true)}
            onOpenPackage={openDetail}
          />
        ) : view === "detail" && detailPkg ? (
          <AppDetail
            pkg={detailPkg}
            platform={platform}
            installed={isInstalled(detailPkg.id)}
            queueStatus={statusFor(detailPkg.id)}
            onBack={goCatalog}
            onDownload={() => onDownload(detailPkg, { force: true })}
            onQueuePaused={() => onQueuePaused(detailPkg, { force: true })}
            onForget={() => forgetInstalled(detailPkg.id)}
            onUninstalled={() => forgetInstalled(detailPkg.id)}
          />
        ) : category === "bundles" ? (
          <BundleView
            platform={platform}
            query={query}
            onOpenBundle={openBundle}
            onInstallBundle={(b) => installBundle(b, false)}
          />
        ) : (
          <Catalog
            category={category}
            query={query}
            platform={platform}
            compact={settings.compactMode}
            statusFor={statusFor}
            isInstalled={isInstalled}
            onOpen={openDetail}
            onDownload={onDownload}
            onQueuePaused={onQueuePaused}
            onCategory={onCategory}
            focusToken={focusToken}
          />
        )}

        <DownloadPanel
          open={queueOpen}
          queue={queue}
          hasPausable={hasPausable}
          hasResumable={hasResumable}
          onClose={() => setQueueOpen(false)}
          onPause={pause}
          onResume={resume}
          onPauseAll={pauseAll}
          onResumeAll={resumeAll}
          onCancel={cancel}
          onRemove={remove}
          onClearFinished={clearFinished}
          onClearAll={clearAll}
        />
      </div>
    </div>
  );
}

export default App;
