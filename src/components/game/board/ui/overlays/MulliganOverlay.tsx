// src/components/game/board/ui/overlays/MulliganOverlay.tsx - Overlay pre-duelo del mulligan de apertura
// (ficha 8, habilidad OPENING_MULLIGAN, PvE). Muestra la mano inicial y ofrece UNA decisión: conservarla o
// rebarajarla una vez. Tras rebarajar, solo queda continuar. Bloquea el tablero hasta decidir (la IA espera
// vía isMatchStartLocked/mulligan pendiente). Estético coherente con el coin toss / cyber del juego.
"use client";

import { motion } from "framer-motion";
import { RotateCcw, Check } from "lucide-react";
import { ICard } from "@/core/entities/ICard";
import { CardThumbnail } from "@/components/game/card/CardThumbnail";

interface MulliganOverlayProps {
  hand: ICard[];
  reshuffled: boolean;
  onReshuffle: () => void;
  onKeep: () => void;
}

export function MulliganOverlay({ hand, reshuffled, onReshuffle, onKeep }: MulliganOverlayProps) {
  return (
    <div className="absolute inset-0 z-[500] flex items-center justify-center bg-[#02040a]/85 p-4 backdrop-blur-md">
      <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] opacity-30" />
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 240, damping: 22 }}
        className="relative w-full max-w-2xl rounded-2xl border border-cyan-400/40 bg-[#04101d]/95 p-5 text-center shadow-[0_0_50px_rgba(34,211,238,0.22)] sm:p-6"
      >
        <p className="font-display text-[10px] uppercase tracking-[0.3em] text-cyan-300/80">Protocolo de apertura</p>
        <h2 className="mt-1 font-display text-xl uppercase tracking-wide text-slate-100 sm:text-2xl">Tu mano inicial</h2>
        <p className="mt-1.5 text-[13px] leading-relaxed text-slate-400">
          {reshuffled
            ? "Mano rebarajada. Ya no puedes volver a rebarajar esta partida."
            : "Puedes rebarajarla una vez o conservarla. Tu nivel, tu XP y el resto de la partida no cambian."}
        </p>

        <motion.div
          key={reshuffled ? "reshuffled" : "initial"}
          initial={{ opacity: 0.3 }}
          animate={{ opacity: 1 }}
          className="mx-auto mt-4 flex flex-wrap items-center justify-center gap-2 sm:gap-3"
        >
          {hand.map((card, index) => (
            <CardThumbnail key={card.runtimeId ?? `${card.id}-${index}`} card={card} className="w-[19vw] max-w-[110px] sm:w-24" />
          ))}
        </motion.div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-center">
          {!reshuffled && (
            <button
              type="button"
              onClick={onReshuffle}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-violet-400/60 bg-violet-500/15 px-5 py-2.5 font-display text-xs uppercase tracking-widest text-violet-100 transition hover:bg-violet-500/25"
            >
              <RotateCcw className="h-4 w-4" />
              Rebarajar (1 vez)
            </button>
          )}
          <button
            type="button"
            onClick={onKeep}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-cyan-400/60 bg-cyan-400/15 px-5 py-2.5 font-display text-xs uppercase tracking-widest text-cyan-100 shadow-[0_0_16px_rgba(34,211,238,0.25)] transition hover:bg-cyan-400/25"
          >
            <Check className="h-4 w-4" />
            {reshuffled ? "Jugar" : "Conservar"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
