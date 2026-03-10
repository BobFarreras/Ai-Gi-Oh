// src/components/hub/home/internal/view/HomeIncompleteDeckExitDialog.tsx - Diálogo de confirmación al salir de Arsenal con deck incompleto.
"use client";

import { AnimatePresence, motion } from "framer-motion";

interface HomeIncompleteDeckExitDialogProps {
  isOpen: boolean;
  deckCardCount: number;
  deckSize: number;
  onClose: () => void;
  onExitToHub: () => void;
  onGoToMarket: () => void;
}

export function HomeIncompleteDeckExitDialog({
  isOpen,
  deckCardCount,
  deckSize,
  onClose,
  onExitToHub,
  onGoToMarket,
}: HomeIncompleteDeckExitDialogProps) {
  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[640] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
        >
          <motion.div
            role="dialog"
            aria-label="Salir de Arsenal con deck incompleto"
            initial={{ opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="w-full max-w-lg rounded-2xl border border-amber-400/45 bg-zinc-950/95 p-4 shadow-[0_0_35px_rgba(251,191,36,0.2)]"
          >
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-amber-300">Deck incompleto</p>
            <p className="mt-2 text-sm font-semibold text-zinc-100">
              Estás saliendo con {deckCardCount}/{deckSize} cartas en el deck principal.
            </p>
            <p className="mt-1 text-xs text-zinc-300">
              Puedes salir igual o ir al Market para conseguir cartas.
            </p>
            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
              <button
                type="button"
                onClick={onExitToHub}
                className="rounded-md border border-zinc-500/70 bg-zinc-900/80 px-3 py-2 text-xs font-black uppercase tracking-wider text-zinc-100 transition-colors hover:border-zinc-300"
              >
                Salir Igual
              </button>
              <button
                type="button"
                onClick={onGoToMarket}
                className="rounded-md border border-emerald-400/65 bg-emerald-950/70 px-3 py-2 text-xs font-black uppercase tracking-wider text-emerald-100 transition-colors hover:border-emerald-300"
              >
                Ir al Market
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-md border border-cyan-400/55 bg-cyan-950/55 px-3 py-2 text-xs font-black uppercase tracking-wider text-cyan-100 transition-colors hover:border-cyan-300"
              >
                Cerrar
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
