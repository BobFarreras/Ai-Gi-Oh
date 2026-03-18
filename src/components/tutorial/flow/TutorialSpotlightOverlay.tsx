// src/components/tutorial/flow/TutorialSpotlightOverlay.tsx - Overlay reusable que oscurece pantalla y resalta el objetivo activo del tutorial.
"use client";
import { CSSProperties, useEffect, useMemo, useState } from "react";

interface ITutorialSpotlightOverlayProps {
  isVisible: boolean;
  targetId: string | null;
}

interface IRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

function resolveRect(targetId: string | null): IRect | null {
  if (!targetId) return null;
  const element = document.querySelector<HTMLElement>(`[data-tutorial-id="${targetId}"]`);
  if (!element) return null;
  const rect = element.getBoundingClientRect();
  return { top: rect.top, left: rect.left, width: rect.width, height: rect.height };
}

export function TutorialSpotlightOverlay({ isVisible, targetId }: ITutorialSpotlightOverlayProps) {
  const [rect, setRect] = useState<IRect | null>(null);

  useEffect(() => {
    if (!isVisible) return;
    const update = () => setRect(resolveRect(targetId));
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    const intervalId = window.setInterval(update, 120);
    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [isVisible, targetId]);

  const frameStyle = useMemo(() => {
    if (!rect) return undefined;
    return {
      top: rect.top - 6,
      left: rect.left - 6,
      width: rect.width + 12,
      height: rect.height + 12,
      boxShadow: "0 0 0 9999px rgba(1, 7, 20, 0.78)",
    } satisfies CSSProperties;
  }, [rect]);

  if (!isVisible || !rect) return null;
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[420]">
      <div className="absolute rounded-xl border-2 border-cyan-300 bg-cyan-400/5 shadow-[0_0_24px_rgba(34,211,238,0.45)] transition-all duration-150" style={frameStyle} />
    </div>
  );
}
