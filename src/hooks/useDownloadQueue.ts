import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CATALOG } from "../data/catalog";
import {
  checkInstalled,
  installPackage,
  scanInstalled,
} from "../lib/install";
import { canInstallPackage, resolveSource } from "../lib/source";
import type { Platform } from "../lib/platform";
import type { AppPackage, QueueItem, QueueItemStatus } from "../types";

const TICK_MS = 200;
const INSTALLED_KEY = "browse.installed";
const LEGACY_INSTALLED_KEY = "everyone.installed";

function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function loadInstalled(): Set<string> {
  try {
    const raw =
      localStorage.getItem(INSTALLED_KEY) ??
      localStorage.getItem(LEGACY_INSTALLED_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as string[];
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function saveInstalled(ids: Set<string>) {
  try {
    localStorage.setItem(INSTALLED_KEY, JSON.stringify([...ids]));
  } catch {
    /* ignore */
  }
}

export interface EnqueueOptions {
  paused?: boolean;
  bundleId?: string;
  /** Allow queueing even when already marked installed (detail reinstall). */
  force?: boolean;
}

/** Fully functional queue — real package managers only (no simulation). */
export function useDownloadQueue(opts: {
  maxConcurrent: number;
  platform: Platform;
}) {
  const { maxConcurrent, platform } = opts;
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [installed, setInstalled] = useState<Set<string>>(() => loadInstalled());
  const installedRef = useRef(installed);
  installedRef.current = installed;
  const maxRef = useRef(maxConcurrent);
  maxRef.current = maxConcurrent;
  const platformRef = useRef(platform);
  platformRef.current = platform;
  const inflight = useRef<Set<string>>(new Set());

  const markInstalled = useCallback((packageId: string) => {
    setInstalled((prev) => {
      if (prev.has(packageId)) return prev;
      const next = new Set(prev);
      next.add(packageId);
      saveInstalled(next);
      return next;
    });
  }, []);

  const forgetInstalled = useCallback((packageId: string) => {
    setInstalled((prev) => {
      if (!prev.has(packageId)) return prev;
      const next = new Set(prev);
      next.delete(packageId);
      saveInstalled(next);
      return next;
    });
  }, []);

  const forgetAllInstalled = useCallback(() => {
    setInstalled(new Set());
    saveInstalled(new Set());
  }, []);

  const isInstalled = useCallback(
    (packageId: string) => installed.has(packageId),
    [installed],
  );

  const enqueue = useCallback((pkg: AppPackage, options?: EnqueueOptions) => {
    if (!options?.force && installedRef.current.has(pkg.id)) return false;
    const source = resolveSource(pkg, platformRef.current);
    let added = false;
    setQueue((prev) => {
      const blocked = prev.some(
        (i) =>
          i.packageId === pkg.id &&
          (i.status === "queued" ||
            i.status === "downloading" ||
            i.status === "installing" ||
            i.status === "paused"),
      );
      if (blocked) return prev;
      added = true;
      const item: QueueItem = {
        id: uid(),
        packageId: pkg.id,
        name: pkg.name,
        source,
        status: options?.paused ? "paused" : "queued",
        progress: 0,
        sizeMb: pkg.sizeMb,
        speedMbps: 0,
        addedAt: Date.now(),
        bundleId: options?.bundleId,
      };
      return [...prev, item];
    });
    return added;
  }, []);

  const enqueueMany = useCallback(
    (pkgs: AppPackage[], options?: EnqueueOptions) => {
      for (const p of pkgs) enqueue(p, options);
    },
    [enqueue],
  );

  const pause = useCallback((id: string) => {
    setQueue((prev) =>
      prev.map((i) =>
        i.id === id &&
        (i.status === "downloading" ||
          i.status === "queued" ||
          i.status === "installing")
          ? { ...i, status: "paused" as QueueItemStatus, speedMbps: 0 }
          : i,
      ),
    );
  }, []);

  const resume = useCallback((id: string) => {
    setQueue((prev) =>
      prev.map((i) =>
        i.id === id && i.status === "paused"
          ? { ...i, status: "queued" as QueueItemStatus }
          : i,
      ),
    );
  }, []);

  const pauseAll = useCallback(() => {
    setQueue((prev) =>
      prev.map((i) =>
        i.status === "downloading" ||
        i.status === "queued" ||
        i.status === "installing"
          ? { ...i, status: "paused" as QueueItemStatus, speedMbps: 0 }
          : i,
      ),
    );
  }, []);

  const resumeAll = useCallback(() => {
    setQueue((prev) =>
      prev.map((i) =>
        i.status === "paused"
          ? { ...i, status: "queued" as QueueItemStatus }
          : i,
      ),
    );
  }, []);

  const cancel = useCallback((id: string) => {
    setQueue((prev) =>
      prev.map((i) =>
        i.id === id &&
        i.status !== "completed" &&
        i.status !== "cancelled"
          ? { ...i, status: "cancelled" as QueueItemStatus, speedMbps: 0 }
          : i,
      ),
    );
    inflight.current.delete(id);
  }, []);

  const remove = useCallback((id: string) => {
    setQueue((prev) => prev.filter((i) => i.id !== id));
    inflight.current.delete(id);
  }, []);

  const clearFinished = useCallback(() => {
    setQueue((prev) =>
      prev.filter(
        (i) =>
          i.status !== "completed" &&
          i.status !== "cancelled" &&
          i.status !== "failed",
      ),
    );
  }, []);

  const clearAll = useCallback(() => {
    setQueue([]);
    inflight.current.clear();
  }, []);

  const statusFor = useCallback(
    (packageId: string): QueueItemStatus | null => {
      const items = queue
        .filter((i) => i.packageId === packageId)
        .sort((a, b) => b.addedAt - a.addedAt);
      return items[0]?.status ?? null;
    },
    [queue],
  );

  // Promote queued → downloading
  useEffect(() => {
    setQueue((prev) => {
      const downloading = prev.filter(
        (i) => i.status === "downloading" || i.status === "installing",
      ).length;
      let slots = maxRef.current - downloading;
      if (slots <= 0) return prev;
      let changed = false;
      const next = prev.map((i) => {
        if (slots > 0 && i.status === "queued") {
          slots -= 1;
          changed = true;
          return {
            ...i,
            status: "downloading" as QueueItemStatus,
            speedMbps: 0,
          };
        }
        return i;
      });
      return changed ? next : prev;
    });
  }, [queue, maxConcurrent]);

  // Real install runner only
  useEffect(() => {
    for (const item of queue) {
      if (item.status !== "downloading") continue;
      if (inflight.current.has(item.id)) continue;

      inflight.current.add(item.id);
      setQueue((prev) =>
        prev.map((i) =>
          i.id === item.id
            ? { ...i, status: "installing" as QueueItemStatus, progress: 5 }
            : i,
        ),
      );

      void (async () => {
        const result = await installPackage(item.source);
        inflight.current.delete(item.id);
        setQueue((prev) =>
          prev.map((i) => {
            if (i.id !== item.id) return i;
            if (i.status === "cancelled" || i.status === "paused") return i;
            if (result.ok) {
              markInstalled(i.packageId);
              return {
                ...i,
                progress: 100,
                speedMbps: 0,
                status: "completed" as QueueItemStatus,
              };
            }
            return {
              ...i,
              speedMbps: 0,
              status: "failed" as QueueItemStatus,
              error: result.message.slice(0, 280),
            };
          }),
        );
      })();
    }
  }, [queue, markInstalled]);

  // Indeterminate progress pulse while package manager runs
  useEffect(() => {
    const timer = window.setInterval(() => {
      setQueue((prev) => {
        let changed = false;
        const next = prev.map((i) => {
          if (i.status === "installing" || i.status === "downloading") {
            changed = true;
            const progress = Math.min(90, i.progress + 0.8 + Math.random() * 0.6);
            return { ...i, progress, speedMbps: 0 };
          }
          return i;
        });
        return changed ? next : prev;
      });
    }, TICK_MS);
    return () => window.clearInterval(timer);
  }, []);

  // Detect what's already on the machine (winget / npm / PATH / etc.) asynchronously in background
  useEffect(() => {
    let cancelled = false;
    const platform = platformRef.current;

    const entries = CATALOG.filter((p) => canInstallPackage(p, platform)).map(
      (p) => ({
        id: p.id,
        source: resolveSource(p, platform),
      }),
    );

    const timer = setTimeout(() => {
      void (async () => {
        const found = await scanInstalled(entries);
        if (cancelled || found.length === 0) return;
        setInstalled((prev) => {
          let changed = false;
          const next = new Set(prev);
          for (const id of found) {
            if (!next.has(id)) {
              next.add(id);
              changed = true;
            }
          }
          if (!changed) return prev;
          saveInstalled(next);
          return next;
        });
      })();
    }, 50);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [platform]);

  const verifyInstalled = useCallback(async (pkg: AppPackage) => {
    const source = resolveSource(pkg, platformRef.current);
    const ok = await checkInstalled(source);
    if (ok) markInstalled(pkg.id);
    else forgetInstalled(pkg.id);
    return ok;
  }, [markInstalled, forgetInstalled]);

  const activeCount = queue.filter(
    (i) =>
      i.status === "queued" ||
      i.status === "downloading" ||
      i.status === "installing" ||
      i.status === "paused",
  ).length;

  const overallProgress = useMemo(() => {
    const active = queue.filter(
      (i) =>
        i.status === "queued" ||
        i.status === "downloading" ||
        i.status === "installing" ||
        i.status === "paused",
    );
    if (active.length === 0) return 0;
    const sum = active.reduce((acc, i) => acc + i.progress, 0);
    return Math.round(sum / active.length);
  }, [queue]);

  const hasPausable = queue.some(
    (i) =>
      i.status === "queued" ||
      i.status === "downloading" ||
      i.status === "installing",
  );
  const hasResumable = queue.some((i) => i.status === "paused");

  return {
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
    markInstalled,
    forgetInstalled,
    forgetAllInstalled,
    verifyInstalled,
    activeCount,
    overallProgress,
    hasPausable,
    hasResumable,
    installedIds: installed,
  };
}

export type DownloadQueueApi = ReturnType<typeof useDownloadQueue>;
