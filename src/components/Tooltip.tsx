import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

type Side = "right" | "left" | "bottom" | "top";

interface TooltipProps {
  label: string;
  /** Optional keyboard hint shown muted, e.g. Ctrl+J */
  hint?: string;
  side?: Side;
  delayMs?: number;
  children: ReactNode;
  className?: string;
}

const GAP = 8;

export function Tooltip({
  label,
  hint,
  side = "right",
  delayMs = 0,
  children,
  className,
}: TooltipProps) {
  const id = useId();
  const wrapRef = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(
    null,
  );
  const timer = useRef<number | null>(null);

  const clearTimer = () => {
    if (timer.current != null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
  };

  const measure = useCallback(() => {
    const el = wrapRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    let top = 0;
    let left = 0;
    switch (side) {
      case "right":
        top = r.top + r.height / 2;
        left = r.right + GAP;
        break;
      case "left":
        top = r.top + r.height / 2;
        left = r.left - GAP;
        break;
      case "bottom":
        top = r.bottom + GAP;
        left = r.left + r.width / 2;
        break;
      case "top":
        top = r.top - GAP;
        left = r.left + r.width / 2;
        break;
    }
    setCoords({ top, left });
  }, [side]);

  const show = () => {
    clearTimer();
    if (delayMs <= 0) {
      measure();
      setOpen(true);
      return;
    }
    timer.current = window.setTimeout(() => {
      measure();
      setOpen(true);
    }, delayMs);
  };

  const hide = () => {
    clearTimer();
    setOpen(false);
  };

  useEffect(() => {
    if (!open) return;
    function onScroll() {
      measure();
    }
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
    };
  }, [open, measure]);

  useEffect(() => () => clearTimer(), []);

  const transform =
    side === "right" || side === "left"
      ? side === "right"
        ? "translateY(-50%)"
        : "translate(-100%, -50%)"
      : side === "bottom"
        ? "translateX(-50%)"
        : "translate(-50%, -100%)";

  return (
    <span
      ref={wrapRef}
      className={`tooltip-wrap ${className ?? ""}`}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      {open &&
        coords &&
        createPortal(
          <span
            id={id}
            role="tooltip"
            className={`ui-tooltip side-${side}`}
            style={{
              top: coords.top,
              left: coords.left,
              transform,
            }}
          >
            <span className="ui-tooltip-label">{label}</span>
            {hint && <kbd className="ui-tooltip-hint">{hint}</kbd>}
          </span>,
          document.body,
        )}
    </span>
  );
}
