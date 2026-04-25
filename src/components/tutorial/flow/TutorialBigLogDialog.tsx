// src/components/tutorial/flow/TutorialBigLogDialog.tsx - Diálogo narrativo de BigLog con botón siguiente y soporte de bloqueos del tutorial.
"use client";
import Image from "next/image";
import { motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";

interface ITutorialBigLogDialogProps {
  title: string;
  description: string;
  canUseNext: boolean;
  isFinished: boolean;
  onNext: () => void;
  targetId?: string | null;
  preferTopPlacement?: boolean;
  forceBottomPlacement?: boolean;
  shouldHighlightNextButton?: boolean;
  disableAutoScrollWhenPinnedTop?: boolean;
  isMobileCompact?: boolean;
}

type DialogPlacement = "bottom" | "top";

function resolveElement(targetId: string | null): HTMLElement | null {
  if (!targetId) return null;
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

export function TutorialBigLogDialog({
  title,
  description,
  canUseNext,
  isFinished,
  onNext,
  targetId = null,
  preferTopPlacement = false,
  forceBottomPlacement = false,
  shouldHighlightNextButton = false,
  disableAutoScrollWhenPinnedTop = false,
  isMobileCompact = false,
}: ITutorialBigLogDialogProps) {
  const containerRef = useRef<HTMLElement | null>(null);
  const forceTopPlacement = !forceBottomPlacement && preferTopPlacement;
  const [placement, setPlacement] = useState<DialogPlacement>("bottom");

  useEffect(() => {
    if (forceBottomPlacement) return;
    if (!targetId) return;
    const updatePlacement = (): void => {
      const targetElement = resolveElement(targetId);
      const targetRect = targetElement?.getBoundingClientRect() ?? null;
      if (forceTopPlacement) {
        setPlacement("top");
        if (!disableAutoScrollWhenPinnedTop && typeof targetElement?.scrollIntoView === "function") {
          targetElement.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
        }
        return;
      }
      if (!targetRect) {
        setPlacement("bottom");
        return;
      }
      const viewportHeight = window.innerHeight;
      const targetCenterY = targetRect.top + targetRect.height / 2;
      setPlacement((previous) => {
        if (targetCenterY >= viewportHeight * 0.55) return "top";
        if (targetCenterY <= viewportHeight * 0.45) return "bottom";
        return previous;
      });
    };
    updatePlacement();
    window.addEventListener("resize", updatePlacement);
    window.addEventListener("scroll", updatePlacement, true);
    return () => {
      window.removeEventListener("resize", updatePlacement);
      window.removeEventListener("scroll", updatePlacement, true);
    };
  }, [disableAutoScrollWhenPinnedTop, forceBottomPlacement, forceTopPlacement, targetId]);

  const positionClass = useMemo(
    () => (forceBottomPlacement ? "bottom-4 top-auto" : placement === "top" ? "top-4 bottom-auto" : "bottom-4 top-auto"),
    [forceBottomPlacement, placement],
  );

  return (
    <aside
      ref={containerRef}
      data-tutorial-overlay="true"
      className={`pointer-events-auto fixed left-1/2 z-[430] -translate-x-1/2 rounded-2xl border border-cyan-300/40 bg-slate-950/82 shadow-[0_10px_38px_rgba(0,0,0,0.45)] backdrop-blur-[2px] transition-all duration-300 ${isMobileCompact ? "w-[min(94vw,34rem)] p-3" : "w-[min(96vw,960px)] p-4"} ${positionClass}`}
    >
      <div className="flex items-start gap-3">
        <Image src="/assets/story/opponents/opp-ch1-biglog/avatar-BigLog.png" alt="Avatar de BigLog" width={isMobileCompact ? 58 : 74} height={isMobileCompact ? 58 : 74} className="rounded-xl border border-cyan-300/35" />
        <div className="min-w-0 flex-1">
          <p className={`${isMobileCompact ? "text-[10px] tracking-[0.2em]" : "text-[11px] tracking-[0.24em]"} font-black uppercase text-cyan-300`}>BigLog Tutorial</p>
          <h3 className={`mt-1 font-black uppercase leading-tight text-cyan-100 ${isMobileCompact ? "text-[0.9rem]" : "text-base sm:text-lg"}`}>{title}</h3>
          <p className={`mt-2 leading-relaxed text-slate-100 ${isMobileCompact ? "text-[0.78rem]" : "text-sm sm:text-base"}`}>{description}</p>
          <div className={`mt-3 flex items-center gap-2 ${isMobileCompact ? "flex-wrap" : ""}`}>
            <motion.button
              type="button"
              data-tutorial-overlay="true"
              onClick={onNext}
              disabled={!canUseNext || isFinished}
              aria-label="Siguiente paso del tutorial"
              className={`rounded-md border border-cyan-200/45 ${isMobileCompact ? "px-2.5 py-1.5 text-[10px]" : "px-3 py-2 text-xs"} font-black uppercase text-cyan-100 disabled:cursor-default disabled:opacity-45 ${
                shouldHighlightNextButton && canUseNext && !isFinished
                  ? "ring-2 ring-cyan-300/90 shadow-[0_0_18px_rgba(34,211,238,0.75)]"
                  : ""
              }`}
              animate={
                shouldHighlightNextButton && canUseNext && !isFinished
                  ? {
                      scale: [1, 1.04, 1],
                      boxShadow: [
                        "0 0 0 rgba(34,211,238,0)",
                        "0 0 18px rgba(34,211,238,0.85)",
                        "0 0 0 rgba(34,211,238,0)",
                      ],
                    }
                  : { scale: 1, boxShadow: "0 0 0 rgba(0,0,0,0)" }
              }
              transition={
                shouldHighlightNextButton && canUseNext && !isFinished
                  ? { duration: 0.95, repeat: Infinity, ease: "easeInOut" }
                  : { duration: 0.15 }
              }
            >
              Siguiente
            </motion.button>
            <span className={`${isMobileCompact ? "text-[9px]" : "text-[10px]"} font-bold uppercase tracking-[0.12em] text-slate-400`}>{isFinished ? "Tutorial completado" : canUseNext ? "Puedes continuar" : "Realiza la acción marcada"}</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
