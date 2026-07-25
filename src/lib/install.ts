import { invoke } from "@tauri-apps/api/core";
import { isInstallableSource } from "./source";

export interface InstallResult {
  ok: boolean;
  message: string;
  code: number;
}

export async function installPackage(source: string): Promise<InstallResult> {
  if (!isInstallableSource(source)) {
    return {
      ok: false,
      message: "No automated installer for this source on this OS.",
      code: 1,
    };
  }
  try {
    return await invoke<InstallResult>("install_package", { source });
  } catch (e) {
    return {
      ok: false,
      message: e instanceof Error ? e.message : String(e),
      code: -1,
    };
  }
}

export async function uninstallPackage(source: string): Promise<InstallResult> {
  try {
    return await invoke<InstallResult>("uninstall_package", { source });
  } catch (e) {
    return {
      ok: false,
      message: e instanceof Error ? e.message : String(e),
      code: -1,
    };
  }
}

export async function checkInstalled(source: string): Promise<boolean> {
  if (!isInstallableSource(source)) return false;
  try {
    return await invoke<boolean>("check_installed", { source });
  } catch {
    return false;
  }
}

export interface ScanEntry {
  id: string;
  source: string;
}

/** Bulk detect which catalog packages are already on this machine. */
export async function scanInstalled(entries: ScanEntry[]): Promise<string[]> {
  if (entries.length === 0) return [];
  try {
    return await invoke<string[]>("scan_installed", { entries });
  } catch {
    return [];
  }
}

export async function detectHostOs(): Promise<string> {
  try {
    return await invoke<string>("host_os");
  } catch {
    return "unknown";
  }
}
