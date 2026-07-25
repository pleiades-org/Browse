import type { AppPackage } from "../types";
import { BrandIcon, darkModeBrandFill, useBrand } from "./BrandIcon";
import { Icon, type IconName } from "./Icon";

const CAT_ICON: Record<string, IconName> = {
  development: "code",
  productivity: "box",
  media: "music",
  games: "game",
  security: "shield",
  utilities: "cpu",
  internet: "global",
};

interface AppIconProps {
  pkg: AppPackage;
  size?: number;
  className?: string;
}

/** Local icon path → brand glyph → category fallback. */
export function AppIcon({ pkg, size = 22, className }: AppIconProps) {
  if (pkg.icon) {
    return (
      <img
        src={pkg.icon}
        alt=""
        width={size}
        height={size}
        className={className ?? "app-icon-img"}
        draggable={false}
        style={{
          width: size,
          height: size,
          objectFit: "contain",
          display: "block",
          flexShrink: 0,
        }}
      />
    );
  }

  if (pkg.brand) {
    return <BrandIcon brandKey={pkg.brand} size={size} title={pkg.name} />;
  }

  return <Icon name={CAT_ICON[pkg.category] ?? "box"} size={size} />;
}

export function useAppIconFill(pkg: AppPackage): string | undefined {
  const brand = useBrand(pkg.brand);
  if (pkg.icon) return undefined;
  return brand?.hex ? darkModeBrandFill(brand.hex) : undefined;
}
