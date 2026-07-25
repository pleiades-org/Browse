import { CATEGORIES } from "../data/catalog";
import type { CategoryId } from "../types";
import { Icon, type IconName } from "./Icon";
import { Tooltip } from "./Tooltip";

const CATEGORY_ICONS: Record<string, IconName> = {
  grid: "grid",
  star: "star",
  category: "category",
  box: "box",
  shield: "shield",
  flash: "flash",
  code: "code",
  music: "music",
  game: "game",
  lock: "lock",
  cpu: "cpu",
  global: "global",
};

const CATEGORY_HINTS: Partial<Record<CategoryId, string>> = {
  all: "Browse everything",
  popular: "Featured picks",
  bundles: "Multi-app packages",
  proton: "Full Proton suite",
  ai: "Agents & models",
  development: "Runtimes & tools",
  productivity: "Office & notes",
  media: "Audio & video",
  games: "Launchers & engines",
  security: "Privacy & safety",
  utilities: "System utilities",
  internet: "Browsers & chat",
};

interface SidebarProps {
  open: boolean;
  category: CategoryId;
  onCategory: (id: CategoryId) => void;
  queueOpen: boolean;
  activeDownloads: number;
  overallProgress: number;
  onToggleQueue: () => void;
  onOpenSettings: () => void;
  settingsActive: boolean;
}

export function Sidebar({
  open,
  category,
  onCategory,
  queueOpen,
  activeDownloads,
  overallProgress,
  onToggleQueue,
  onOpenSettings,
  settingsActive,
}: SidebarProps) {
  if (!open) return null;

  const showProgress = activeDownloads > 0;

  return (
    <aside className="sidebar">
      <div className="rail">
        {CATEGORIES.map((cat) => (
          <Tooltip
            key={cat.id}
            label={cat.label}
            hint={CATEGORY_HINTS[cat.id]}
            side="right"
          >
            <button
              type="button"
              className={`icon-btn ${category === cat.id && !settingsActive ? "active" : ""}`}
              aria-label={cat.label}
              aria-pressed={category === cat.id && !settingsActive}
              onClick={() => onCategory(cat.id)}
            >
              <Icon name={CATEGORY_ICONS[cat.icon] ?? "grid"} size={16} />
            </button>
          </Tooltip>
        ))}

        <div className="spacer" />

        <Tooltip
          label="Downloads"
          hint={
            activeDownloads > 0
              ? `${overallProgress}% · ${activeDownloads} active · Ctrl+J`
              : "Queue · Ctrl+J"
          }
          side="right"
        >
          <div className="queue-rail-slot">
            <button
              type="button"
              className={`icon-btn queue-btn ${queueOpen ? "active" : ""}`}
              aria-label="Downloads"
              aria-pressed={queueOpen}
              onClick={onToggleQueue}
            >
              <Icon name="cloud-download" size={16} />
              {activeDownloads > 0 && (
                <span className="badge">
                  {activeDownloads > 9 ? "9+" : activeDownloads}
                </span>
              )}
            </button>
            {showProgress && (
              <div
                className="rail-progress"
                title={`${overallProgress}% overall`}
                aria-hidden
              >
                <div
                  className="rail-progress-fill"
                  style={{ width: `${overallProgress}%` }}
                />
              </div>
            )}
          </div>
        </Tooltip>

        <Tooltip label="Settings" hint="Ctrl+," side="right">
          <button
            type="button"
            className={`icon-btn ${settingsActive ? "active" : ""}`}
            aria-label="Settings"
            aria-pressed={settingsActive}
            onClick={onOpenSettings}
          >
            <Icon name="settings" size={16} />
          </button>
        </Tooltip>
      </div>
    </aside>
  );
}
