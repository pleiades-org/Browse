import type { BrandIconFn } from "reicon-brands/createIcon";
import { getBrand } from "../data/brands";

/** Relative luminance 0–1 from hex (no #). */
function luminance(hex: string): number {
  const h = hex.replace("#", "").slice(0, 6);
  if (h.length < 6) return 0.5;
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function darkModeBrandFill(hex?: string): string {
  if (!hex) return "var(--color-text)";
  const clean = hex.replace("#", "").slice(0, 6);
  if (clean.length < 6) return "var(--color-text)";
  const L = luminance(clean);
  if (L >= 0.38) return `#${clean}`;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  const t = L < 0.12 ? 0.82 : 0.62;
  const nr = Math.round(r + (236 - r) * t);
  const ng = Math.round(g + (236 - g) * t);
  const nb = Math.round(b + (236 - b) * t);
  return `rgb(${nr}, ${ng}, ${nb})`;
}

/** Normalize default-export / named-export interop from Vite. */
export function asBrandIcon(mod: unknown): BrandIconFn | null {
  if (!mod) return null;
  if (typeof mod === "function") {
    const fn = mod as BrandIconFn;
    if (typeof fn.svgContent === "string") return fn;
  }
  if (typeof mod === "object") {
    const o = mod as Record<string, unknown>;
    if (o.default) return asBrandIcon(o.default);
    // named export e.g. { Github: fn }
    for (const v of Object.values(o)) {
      const b = asBrandIcon(v);
      if (b) return b;
    }
  }
  return null;
}

export function useBrand(key?: string): BrandIconFn | null {
  return key ? getBrand(key) : null;
}

/** Sync brand logo — no deferred load (fixes blank icons). */
export function BrandIcon({
  brandKey,
  brand,
  size = 20,
  color,
  title,
}: {
  brandKey?: string;
  brand?: BrandIconFn | null;
  size?: number;
  color?: string;
  title?: string;
}) {
  const resolved = brand ?? (brandKey ? getBrand(brandKey) : null);
  if (!resolved?.svgContent) {
    return (
      <span
        className="brand-icon brand-placeholder"
        style={{ width: size, height: size, display: "inline-block" }}
        aria-hidden
      />
    );
  }

  const fill = color ?? darkModeBrandFill(resolved.hex);
  // Prefer toSvg so paths pick up brand color correctly
  // Inline SVG with explicit size — fills cell cleanly (no tiny glyph in huge box)
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      role="img"
      aria-hidden={title ? undefined : true}
      aria-label={title}
      className="brand-icon"
      style={{
        width: size,
        height: size,
        display: "block",
        flexShrink: 0,
      }}
      dangerouslySetInnerHTML={{ __html: resolved.svgContent }}
    />
  );
}

export function hasBrandKey(key?: string): boolean {
  return !!getBrand(key);
}
