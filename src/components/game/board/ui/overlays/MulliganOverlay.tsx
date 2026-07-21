// src/components/game/board/ui/overlays/MulliganOverlay.tsx - Prompt del mulligan de apertura (ficha 8, PvE).
// NO oscurece ni muestra las cartas (se ven en la mano del jugador abajo): solo la decisión Conservar/Rebarajar.
// Al rebarajar, reproduce una animación breve (4 cartas suben al mazo y 4 nuevas bajan) que enmascara el cambio
// instantáneo de la mano; el rebaraje real se aplica a mitad de la animación.
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw, Check } from "lucide-react";

interface MulliganOverlayProps {
  reshuffled: boolean;
  onReshuffle: () => void;
  onKeep: () => void;
}

const RESHUFFLE_MS = 900;
const CARDS = [0, 1, 2, 3];

/** Reverso de carta estilizado (cyber) para la animación de rebaraje. */
function CardBack() {
  return (
    <div className="absolute left-1/2 top-1/2 h-24 w-16 -translate-x-1/2 -translate-y-1/2 rounded-lg border border-cyan-300/50 bg-gradient-to-br from-[#0a2a3a] to-[#04101d] shadow-[0_0_18px_rgba(34,211,238,0.35)]">
      <div className="absolute inset-1 rounded-md border border-cyan-400/20 bg-[radial-gradient(circle_at_50%_40%,rgba(34,211,238,0.25),transparent_60%)]" />
    </div>
  );
}

/** Animación: las 4 cartas actuales suben hacia el mazo (arriba) y 4 nuevas bajan a la mano. */
function ReshuffleFlourish() {
  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* Velo BREVE solo durante la animación (no es la oscuridad persistente que molestaba). */}
      <div className="absolute inset-0 bg-black/35" />
      <div className="relative h-48 w-72">
        {CARDS.map((i) => (
          <motion.div
            key={`out-${i}`}
            className="absolute inset-0"
            initial={{ x: (i - 1.5) * 44, y: 96, rotate: (i - 1.5) * 7, opacity: 1 }}
            animate={{ x: 0, y: -104, rotate: 0, scale: 0.55, opacity: 0 }}
            transition={{ duration: 0.42, delay: i * 0.05, ease: "easeIn" }}
          >
            <CardBack />
          </motion.div>
        ))}
        {CARDS.map((i) => (
          <motion.div
            key={`in-${i}`}
            className="absolute inset-0"
            initial={{ x: 0, y: -104, rotate: 0, scale: 0.55, opacity: 0 }}
            animate={{ x: (i - 1.5) * 44, y: 96, rotate: (i - 1.5) * 7, scale: 1, opacity: 1 }}
            transition={{ duration: 0.44, delay: 0.42 + i * 0.06, ease: "easeOut" }}
          >
            <CardBack />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

export function MulliganOverlay({ reshuffled, onReshuffle, onKeep }: MulliganOverlayProps) {
  const [reshuffling, setReshuffling] = useState(false);

  const handleReshuffle = () => {
    if (reshuffling) return;
    setReshuffling(true);
    // El rebaraje real se aplica a mitad de la animación → el cambio de mano queda oculto tras el velo/flourish.
    window.setTimeout(() => onReshuffle(), RESHUFFLE_MS * 0.5);
    window.setTimeout(() => setReshuffling(false), RESHUFFLE_MS);
  };

  return (
    // Captura clics (transparente, SIN oscurecer): mientras se decide el mulligan no se puede invocar/jugar,
    // pero la mano sigue visible detrás. Debes elegir Conservar/Rebarajar antes de empezar a jugar.
    <div className="absolute inset-0 z-[500]">
      <AnimatePresence>
        {!reshuffling && (
          <motion.div
            key="prompt"
            initial={{ opacity: 0, y: -14, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -14, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 240, damping: 22 }}
            className="pointer-events-auto absolute left-1/2 top-[22%] w-[min(90vw,22rem)] -translate-x-1/2 rounded-2xl border border-cyan-400/40 bg-[#04101d]/92 px-4 py-3 text-center shadow-[0_0_34px_rgba(34,211,238,0.22)] backdrop-blur-sm sm:top-[26%]"
          >
            <p className="font-display text-[10px] uppercase tracking-[0.3em] text-cyan-300/80">Mano de apertura</p>
            <p className="mt-1 text-[13px] leading-relaxed text-slate-300">
              {reshuffled ? "Mano rebarajada. Ya no puedes rebarajar más esta partida." : "Mírala abajo. ¿Quieres rebarajarla una vez?"}
            </p>
            <div className="mt-3 flex justify-center gap-2">
              {!reshuffled && (
                <button
                  type="button"
                  onClick={handleReshuffle}
                  className="inline-flex items-center gap-2 rounded-lg border border-violet-400/60 bg-violet-500/15 px-4 py-2 font-display text-xs uppercase tracking-widest text-violet-100 transition hover:bg-violet-500/25"
                >
                  <RotateCcw className="h-4 w-4" />
                  Rebarajar
                </button>
              )}
              <button
                type="button"
                onClick={onKeep}
                className="inline-flex items-center gap-2 rounded-lg border border-cyan-400/60 bg-cyan-400/15 px-4 py-2 font-display text-xs uppercase tracking-widest text-cyan-100 shadow-[0_0_16px_rgba(34,211,238,0.25)] transition hover:bg-cyan-400/25"
              >
                <Check className="h-4 w-4" />
                {reshuffled ? "Jugar" : "Conservar"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>{reshuffling && <ReshuffleFlourish key="flourish" />}</AnimatePresence>
    </div>
  );
}
