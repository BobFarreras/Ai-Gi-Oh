// src/components/tutorial/flow/TutorialSpotlightOverlay.tsx - Overlay reusable que oscurece pantalla y resalta el objetivo activo del tutorial.
"use client";
import { CSSProperties, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";

interface ITutorialSpotlightOverlayProps {
  isVisible: boolean;
  targetId: string | null;
  disableAutoScroll?: boolean;
  backdropOpacity?: number;
}

interface IRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

function resolveVisibleElementByTutorialId(targetId: string): HTMLElement | null {
  const candidates = Array.from(document.querySelectorAll<HTMLElement>(`[data-tutorial-id="${targetId}"]`));
  if (candidates.length === 0) return null;
  const visible = candidates.filter((node) => {
    const rect = node.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) return false;
    const style = window.getComputedStyle(node);
    return style.display !== "none" && style.visibility !== "hidden";
  });
  if (visible.length === 0) return null;
  visible.sort((a, b) => b.getBoundingClientRect().width * b.getBoundingClientRect().height - a.getBoundingClientRect().width * a.getBoundingClientRect().height);
  return visible[0] ?? null;
}

function resolveRect(targetId: string | null): IRect | null {
  if (!targetId) return null;
  const element = resolveVisibleElementByTutorialId(targetId);
  if (element) {
    const rect = element.getBoundingClientRect();
    return { top: rect.top, left: rect.left, width: rect.width, height: rect.height };
  }
  const groupedElements = Array.from(document.querySelectorAll<HTMLElement>(`[data-tutorial-group="${targetId}"]`));
  if (groupedElements.length === 0) return null;
  const rects = groupedElements.map((node) => node.getBoundingClientRect());
  const top = Math.min(...rects.map((rect) => rect.top));
  const left = Math.min(...rects.map((rect) => rect.left));
  const right = Math.max(...rects.map((rect) => rect.right));
  const bottom = Math.max(...rects.map((rect) => rect.bottom));
  return { top, left, width: right - left, height: bottom - top };
}

function ensureTargetVisibility(targetId: string | null): void {
  if (!targetId) return;
  const element =
    resolveVisibleElementByTutorialId(targetId) ??
    document.querySelector<HTMLElement>(`[data-tutorial-group="${targetId}"]`);
  if (!element) return;
  const rect = element.getBoundingClientRect();
  const isVisibleVertically = rect.top >= 56 && rect.bottom <= window.innerHeight - 56;
  if (isVisibleVertically) return;
  if (typeof element.scrollIntoView !== "function") return;
  element.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
}

/** Evita re-render del overlay cuando el rect del objetivo no cambió (el caso común al sondear). */
function areRectsEqual(a: IRect | null, b: IRect | null): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return a.top === b.top && a.left === b.left && a.width === b.width && a.height === b.height;
}

export function TutorialSpotlightOverlay({ isVisible, targetId, disableAutoScroll = false, backdropOpacity = 0.78 }: ITutorialSpotlightOverlayProps) {
  const [rect, setRect] = useState<IRect | null>(null);
  const lastAutoScrollTargetRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isVisible) return;
    const update = () => {
      const nextRect = resolveRect(targetId);
      // Solo re-renderiza si el objetivo realmente se movió, no en cada tick del sondeo.
      setRect((previous) => (areRectsEqual(previous, nextRect) ? previous : nextRect));
      if (!disableAutoScroll && targetId && lastAutoScrollTargetRef.current !== targetId) {
        ensureTargetVisibility(targetId);
        lastAutoScrollTargetRef.current = targetId;
      }
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    const intervalId = window.setInterval(update, 160);
    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [disableAutoScroll, isVisible, targetId]);

  const positionStyle = useMemo(() => {
    if (!rect) return undefined;
    return {
      top: rect.top - 6,
      left: rect.left - 6,
      width: rect.width + 12,
      height: rect.height + 12,
    } satisfies CSSProperties;
  }, [rect]);

  if (!isVisible || !rect) return null;
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[420]">
      {/* El shake (x) es transform: se compone en GPU, sin repintar. */}
      <motion.div
        className="absolute transition-[top,left,width,height] duration-150"
        style={positionStyle}
        animate={{ x: [0, -1.5, 1.5, -1.5, 0] }}
        transition={{ duration: 0.85, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* Backdrop estático: la sombra de 9999px ya no se anima, así que no repinta la pantalla cada frame. */}
        <div className="absolute inset-0 rounded-xl" style={{ boxShadow: `0 0 0 9999px rgba(1, 7, 20, ${backdropOpacity})` }} />
        {/* Marco con glow pulsante: sombra pequeña, repinta solo alrededor del recuadro. */}
        <motion.div
          className="absolute inset-0 rounded-xl border-2 border-cyan-300 bg-cyan-400/8"
          animate={{
            boxShadow: [
              "0 0 18px rgba(34,211,238,0.38)",
              "0 0 34px rgba(34,211,238,0.82)",
              "0 0 18px rgba(34,211,238,0.38)",
            ],
          }}
          transition={{ duration: 0.85, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>
    </div>
  );
}
