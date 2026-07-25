import type { ComponentType, SVGProps } from "react";
import Add from "reicon-react/icons/Add";
import ArrowDown from "reicon-react/icons/ArrowDown";
import ArrowLeft from "reicon-react/icons/ArrowLeft";
import ArrowUpRight from "reicon-react/icons/ArrowUpRight";
import Box from "reicon-react/icons/Box";
import Brush from "reicon-react/icons/Brush";
import Camera from "reicon-react/icons/Camera";
import Category from "reicon-react/icons/Category";
import Check from "reicon-react/icons/Check";
import Chrome from "reicon-react/icons/Chrome";
import CloudDownload from "reicon-react/icons/CloudDownload";
import Code from "reicon-react/icons/Code";
import Copy from "reicon-react/icons/Copy";
import Cpu from "reicon-react/icons/Cpu";
import DesktopDownload from "reicon-react/icons/DesktopDownload";
import Download from "reicon-react/icons/Download";
import Flash from "reicon-react/icons/Flash";
import Game from "reicon-react/icons/Game";
import Global from "reicon-react/icons/Global";
import Grid from "reicon-react/icons/Grid";
import Headphone from "reicon-react/icons/Headphone";
import Heart from "reicon-react/icons/Heart";
import Home from "reicon-react/icons/Home";
import List from "reicon-react/icons/List";
import Lock from "reicon-react/icons/Lock";
import Minus from "reicon-react/icons/Minus";
import Monitor from "reicon-react/icons/Monitor";
import More from "reicon-react/icons/More";
import Music from "reicon-react/icons/Music";
import Pause from "reicon-react/icons/Pause";
import People from "reicon-react/icons/People";
import Play from "reicon-react/icons/Play";
import Refresh from "reicon-react/icons/Refresh";
import Search from "reicon-react/icons/Search";
import Settings2 from "reicon-react/icons/Settings2";
import Shield from "reicon-react/icons/Shield";
import Sidebar from "reicon-react/icons/Sidebar";
import Star from "reicon-react/icons/Star";
import Stop from "reicon-react/icons/Stop";
import Trash from "reicon-react/icons/Trash";
import Video from "reicon-react/icons/Video";
import X from "reicon-react/icons/X";

export type IconName =
  | "add"
  | "arrow-down"
  | "arrow-left"
  | "external"
  | "box"
  | "brush"
  | "camera"
  | "category"
  | "check"
  | "chrome"
  | "cloud-download"
  | "code"
  | "copy"
  | "cpu"
  | "desktop-download"
  | "download"
  | "flash"
  | "game"
  | "global"
  | "grid"
  | "headphone"
  | "heart"
  | "home"
  | "list"
  | "lock"
  | "minimize"
  | "maximize"
  | "restore"
  | "monitor"
  | "more"
  | "music"
  | "pause"
  | "people"
  | "play"
  | "refresh"
  | "search"
  | "settings"
  | "shield"
  | "sidebar"
  | "star"
  | "trash"
  | "video"
  | "close";

type ReiconProps = {
  size?: number | string;
  color?: string;
  weight?: "Outline" | "Filled";
  strokeWidth?: number | string;
  className?: string;
  "aria-hidden"?: boolean | "true" | "false";
} & SVGProps<SVGSVGElement>;

type ReiconIcon = ComponentType<ReiconProps>;

const icons: Record<IconName, ReiconIcon> = {
  add: Add as ReiconIcon,
  "arrow-down": ArrowDown as ReiconIcon,
  "arrow-left": ArrowLeft as ReiconIcon,
  external: ArrowUpRight as ReiconIcon,
  box: Box as ReiconIcon,
  brush: Brush as ReiconIcon,
  camera: Camera as ReiconIcon,
  category: Category as ReiconIcon,
  check: Check as ReiconIcon,
  chrome: Chrome as ReiconIcon,
  "cloud-download": CloudDownload as ReiconIcon,
  code: Code as ReiconIcon,
  copy: Copy as ReiconIcon,
  cpu: Cpu as ReiconIcon,
  "desktop-download": DesktopDownload as ReiconIcon,
  download: Download as ReiconIcon,
  flash: Flash as ReiconIcon,
  game: Game as ReiconIcon,
  global: Global as ReiconIcon,
  grid: Grid as ReiconIcon,
  headphone: Headphone as ReiconIcon,
  heart: Heart as ReiconIcon,
  home: Home as ReiconIcon,
  list: List as ReiconIcon,
  lock: Lock as ReiconIcon,
  minimize: Minus as ReiconIcon,
  maximize: Stop as ReiconIcon,
  restore: Copy as ReiconIcon,
  monitor: Monitor as ReiconIcon,
  more: More as ReiconIcon,
  music: Music as ReiconIcon,
  pause: Pause as ReiconIcon,
  people: People as ReiconIcon,
  play: Play as ReiconIcon,
  refresh: Refresh as ReiconIcon,
  search: Search as ReiconIcon,
  settings: Settings2 as ReiconIcon,
  shield: Shield as ReiconIcon,
  sidebar: Sidebar as ReiconIcon,
  star: Star as ReiconIcon,
  trash: Trash as ReiconIcon,
  video: Video as ReiconIcon,
  close: X as ReiconIcon,
};

export function Icon({
  name,
  size = 16,
  stroke = 1.5,
  weight = "Outline",
  color,
  className,
}: {
  name: IconName;
  size?: number;
  stroke?: number;
  weight?: "Outline" | "Filled";
  color?: string;
  className?: string;
}) {
  const Comp = icons[name];
  if (!Comp) return null;
  return (
    <Comp
      size={size}
      color={color}
      weight={weight}
      strokeWidth={stroke}
      className={className}
      aria-hidden="true"
    />
  );
}

