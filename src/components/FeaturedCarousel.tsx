import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { getPackage } from "../data/catalog";
import {
  CORE_LAUNCHER_PACKAGE,
  PLEIADES_CHAT_PACKAGE,
  getFeaturedSlides,
  type FeaturedSlide,
} from "../data/featured";
import { canInstallPackage } from "../lib/source";
import type { AppPackage, Platform, QueueItemStatus } from "../types";
import { AppIcon } from "./AppIcon";
import { Icon } from "./Icon";

interface FeaturedCarouselProps {
  platform: Platform;
  isInstalled: (id: string) => boolean;
  statusFor: (id: string) => QueueItemStatus | null;
  onOpen: (pkg: AppPackage) => void;
  onInstall: (pkg: AppPackage) => void;
}

function resolvePkg(slide: FeaturedSlide): AppPackage | undefined {
  return (
    getPackage(slide.packageId) ??
    (slide.packageId === CORE_LAUNCHER_PACKAGE.id
      ? CORE_LAUNCHER_PACKAGE
      : slide.packageId === PLEIADES_CHAT_PACKAGE.id
        ? PLEIADES_CHAT_PACKAGE
        : undefined)
  );
}

export function FeaturedCarousel({
  platform,
  isInstalled,
  statusFor,
  onOpen,
  onInstall,
}: FeaturedCarouselProps) {
  const slides = useMemo(() => getFeaturedSlides(platform), [platform]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [slides.length]);

  useEffect(() => {
    if (slides.length <= 1) return;
    const t = window.setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, 16000);
    return () => window.clearInterval(t);
  }, [slides.length]);

  if (slides.length === 0) return null;

  const slide = slides[Math.min(index, slides.length - 1)];
  const pkg = resolvePkg(slide);
  if (!pkg) return null;

  const installOk = canInstallPackage(pkg, platform);
  const done = isInstalled(pkg.id) || statusFor(pkg.id) === "completed";
  const busy =
    !done &&
    (statusFor(pkg.id) === "queued" ||
      statusFor(pkg.id) === "downloading" ||
      statusFor(pkg.id) === "installing" ||
      statusFor(pkg.id) === "paused");

  const preview = slide.preview ?? pkg.preview;
  const silentHint = slide.silentHint ?? "silent install";

  return (
    <section className="hero-carousel" aria-label="Featured">
      <div
        className={`hero-slide ${preview ? "has-preview" : ""}`}
        style={
          {
            "--hero-accent": slide.accent ?? "#e0e0e0",
          } as CSSProperties
        }
      >
        <div className="hero-copy">
          {slide.badge && <span className="hero-badge">{slide.badge}</span>}
          <h2 className="hero-title">{slide.title}</h2>
          <p className="hero-sub">{slide.subtitle}</p>
          <div className="hero-meta">
            <span>v{pkg.version}</span>
            <span className="dot">·</span>
            <span>{pkg.publisher}</span>
            <span className="dot">·</span>
            <span className="mono">{silentHint}</span>
            {!installOk && (
              <>
                <span className="dot">·</span>
                <span>Windows install</span>
              </>
            )}
          </div>
          <div className="hero-actions">
            <button
              type="button"
              className="btn-primary"
              disabled={done || busy || !installOk}
              onClick={() => onInstall(pkg)}
            >
              <Icon name={done ? "check" : "desktop-download"} size={16} />
              <span>
                {done
                  ? "Installed"
                  : busy
                    ? "Installing…"
                    : !installOk
                      ? "Windows only"
                      : "Install"}
              </span>
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => onOpen(pkg)}
            >
              <Icon name="external" size={15} />
              <span>Details</span>
            </button>
          </div>
        </div>

        <div className="hero-art" aria-hidden>
          {preview ? (
            <div className="hero-preview-wrap">
              <img
                src={preview}
                alt=""
                className="hero-preview-img"
                draggable={false}
              />
              <div className="hero-preview-icon">
                <AppIcon pkg={pkg} size={28} />
              </div>
            </div>
          ) : (
            <>
              <div className="hero-orb" />
              <div className="hero-icon-wrap">
                <AppIcon pkg={pkg} size={48} />
              </div>
            </>
          )}
        </div>
      </div>

      {slides.length > 1 && (
        <div className="hero-dots" role="tablist" aria-label="Featured slides">
          {slides.map((s, i) => (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={i === index}
              className={`hero-dot ${i === index ? "active" : ""}`}
              onClick={() => setIndex(i)}
              title={s.title}
            />
          ))}
        </div>
      )}
    </section>
  );
}
