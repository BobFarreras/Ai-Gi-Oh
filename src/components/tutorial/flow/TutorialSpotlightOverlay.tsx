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

export function TutorialSpotlightOverlay({ isVisible, targetId, disableAutoScroll = false, backdropOpacity = 0.78 }: ITutorialSpotlightOverlayProps) {
  const [rect, setRect] = useState<IRect | null>(null);
  const lastAutoScrollTargetRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isVisible) return;
    const update = () => {
      setRect(resolveRect(targetId));
      if (!disableAutoScroll && targetId && lastAutoScrollTargetRef.current !== targetId) {
        ensureTargetVisibility(targetId);
        lastAutoScrollTargetRef.current = targetId;
      }
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    const intervalId = window.setInterval(update, 120);
    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [disableAutoScroll, isVisible, targetId]);

  const frameStyle = useMemo(() => {
    if (!rect) return undefined;
    return {
      top: rect.top - 6,
      left: rect.left - 6,
      width: rect.width + 12,
      height: rect.height + 12,
      boxShadow: `0 0 0 9999px rgba(1, 7, 20, ${backdropOpacity})`,
    } satisfies CSSProperties;
  }, [backdropOpacity, rect]);

  if (!isVisible || !rect) return null;
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[420]">
      <motion.div
        className="absolute rounded-xl border-2 border-cyan-300 bg-cyan-400/8 transition-all duration-150"
        style={frameStyle}
        animate={{
          boxShadow: [
            `0 0 0 9999px rgba(1, 7, 20, ${backdropOpacity}), 0 0 18px rgba(34,211,238,0.38)`,
            `0 0 0 9999px rgba(1, 7, 20, ${backdropOpacity}), 0 0 34px rgba(34,211,238,0.82)`,
            `0 0 0 9999px rgba(1, 7, 20, ${backdropOpacity}), 0 0 18px rgba(34,211,238,0.38)`,
          ],
          x: [0, -1.5, 1.5, -1.5, 0],
        }}
        transition={{ duration: 0.85, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}
