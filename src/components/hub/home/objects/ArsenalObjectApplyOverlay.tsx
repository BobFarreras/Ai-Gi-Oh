// src/components/hub/home/objects/ArsenalObjectApplyOverlay.tsx - Cinemática al aplicar un objeto a una carta
// (caramelo → sube de nivel; mejora → +ATK/+DEF). Misma familia visual que la evolución: fogonazo, la carta con
// glow y el cambio resaltado.
"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { ICard } from "@/core/entities/ICard";
import { Card } from "@/components/game/card/Card";
import { useHubModuleSfx } from "@/components/hub/internal/use-hub-module-sfx";
import { useViewportWidth } from "@/components/hub/internal/use-viewport-width";
import { isMobileLayoutViewport } from "@/components/internal/layout-breakpoints";

const CARD_WIDTH_PX = 260;
const CARD_HEIGHT_PX = 380;

export interface IArsenalObjectApplyResult {
  card: ICard;
  versionTier: number;
  /** Etiqueta grande del cambio: "Nivel 12 → 14" o "+100 ATAQUE". */
  headline: string;
  /** Nivel/xp para pintar la carta ya con su nuevo estado. */
  level: number;
  xp: number;
}

interface IArsenalObjectApplyOverlayProps {
  result: IArsenalObjectApplyResult | null;
  onClose: () => void;
}

export function ArsenalObjectApplyOverlay({ result, onClose }: IArsenalObjectApplyOverlayProps) {
  const viewportWidth = useViewportWidth();
  const isMobileViewport = isMobileLayoutViewport(viewportWidth);
  const { play } = useHubModuleSfx();
  useEffect(() => {
    if (!result) return;
    play("EVOLUTION_OVERLAY");
  }, [result, play]);
  if (!result) return null;
  const cardScale = isMobileViewport ? 0.52 : 0.82;

  return (
    <div className="absolute inset-0 z-[440] flex items-center justify-center overflow-hidden bg-black/75 px-3 py-4 backdrop-blur-md sm:px-6" role="dialog" aria-modal="true" aria-label="Objeto aplicado">
      <motion.div initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.25 }} className="relative flex w-full max-w-xl flex-col items-center">
        <motion.div
          aria-hidden
          initial={{ opacity: 0.4, scale: 0.8 }}
          animate={{ opacity: [0.4, 0.9, 0.35], scale: [0.8, 1.45, 1.05] }}
          transition={{ duration: 1.1, times: [0, 0.55, 1] }}
          className="absolute h-[280px] w-[280px] rounded-full bg-[radial-gradient(circle,rgba(251,146,60,0.35),rgba(245,158,11,0.22),transparent_70%)] blur-2xl sm:h-[440px] sm:w-[440px]"
        />
        <motion.div
          className="mb-4 rounded border border-amber-400/45 bg-[#1a1206]/85 px-4 py-2 text-center font-display text-sm font-black uppercase tracking-[0.16em] text-amber-100 sm:text-base"
          animate={{ scale: [1, 1.12, 1], textShadow: ["0 0 0px rgba(251,191,36,0)", "0 0 14px rgba(251,191,36,0.9)", "0 0 0px rgba(251,191,36,0)"] }}
          transition={{ duration: 0.9, repeat: 1 }}
        >
          {result.headline}
        </motion.div>

        <div className="relative" style={{ width: CARD_WIDTH_PX * cardScale, height: CARD_HEIGHT_PX * cardScale }}>
          <motion.div
            initial={{ scale: cardScale * 0.72, rotate: -2 }}
            animate={{ scale: [cardScale * 0.72, cardScale * 1.12, cardScale], rotate: [-2, 2, 0] }}
            transition={{ duration: 1.1, times: [0, 0.65, 1] }}
            style={{ transformOrigin: "top left" }}
            className="absolute left-0 top-0 shadow-[0_0_70px_rgba(251,146,60,0.7)]"
          >
            <Card card={result.card} versionTier={result.versionTier} level={result.level} xp={result.xp} disableHoverEffects disableDefaultShadow clipToFrameShape />
          </motion.div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-amber-400/70 bg-amber-500/15 px-4 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-amber-100 transition hover:bg-amber-500/25 active:scale-95 sm:text-xs"
        >
          Continuar
        </button>
      </motion.div>
    </div>
  );
}
