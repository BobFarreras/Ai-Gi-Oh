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
      {isOpen && (
        <div className="fixed inset-0 z-[640] flex items-center justify-center px-4">
          {/* Backdrop con desenfoque extremo y cierre al clickear fuera */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md cursor-pointer pointer-events-auto"
          />

          {/* Modal contenedor - Animación Spring */}
          <motion.div
            role="alertdialog"
            aria-labelledby="dialog-title"
            aria-describedby="dialog-desc"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 10 }}
            transition={{ type: "spring", stiffness: 450, damping: 25 }}
            className="relative w-full max-w-md border border-amber-500/40 bg-zinc-950/95 p-6 shadow-[0_0_40px_rgba(245,158,11,0.1)] pointer-events-auto"
            style={{
              // Corte Cyberpunk en la esquina inferior derecha
              clipPath: "polygon(0 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%)",
            }}
          >
            {/* Acentos visuales UI (Neones estructurales) */}
            <div className="absolute left-0 top-0 h-1 w-20 bg-amber-400" />
            <div className="absolute right-0 top-0 h-full w-[1px] bg-gradient-to-b from-amber-500/40 to-transparent" />

            {/* Cabecera y Mensaje */}
            <div className="flex items-start gap-4">
              {/* Icono de Alerta */}
              <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-amber-500/10 border border-amber-500/30 text-amber-400 shadow-[inset_0_0_10px_rgba(245,158,11,0.2)]">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>

              <div>
                <h2 id="dialog-title" className="text-xs font-black uppercase tracking-[0.2em] text-amber-400">
                  Alerta de Sistema
                </h2>
                <p className="mt-1 text-base font-bold text-zinc-100">
                  Deck principal incompleto ({deckCardCount}/{deckSize})
                </p>
                <p id="dialog-desc" className="mt-2 text-sm leading-relaxed text-zinc-400">
                  Tu mazo actual no cumple el mínimo requerido para iniciar un combate. Puedes salir de todas formas o ir al Market a buscar suministros.
                </p>
              </div>
            </div>

            {/* Botonera: Jerarquía Clara */}
            <div className="mt-8 flex flex-col-reverse justify-end gap-3 sm:flex-row">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-zinc-500 transition-colors hover:text-zinc-300"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={onExitToHub}
                className="border border-zinc-700 bg-zinc-900/50 px-4 py-2 text-xs font-bold uppercase tracking-wider text-zinc-300 transition-all hover:bg-zinc-800 hover:text-white"
              >
                Salir Igual
              </button>

              <button
                type="button"
                onClick={onGoToMarket}
                className="group relative flex items-center justify-center gap-2 border border-emerald-400/50 bg-emerald-500/10 px-5 py-2 text-xs font-bold uppercase tracking-wider text-emerald-400 transition-all hover:bg-emerald-500/20 hover:shadow-[0_0_15px_rgba(16,185,129,0.3)]"
              >
                <span>Ir al Market</span>
                <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}