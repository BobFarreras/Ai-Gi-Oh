// src/components/game/board/ui/overlays/internal/MandatoryActionHintBanner.tsx - Aviso de acción obligatoria que aparece arriba y se autooculta para no tapar el tablero.
"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

// Tiempo que el aviso permanece visible antes de desvanecerse (deja leerlo sin tapar las cartas).
const VISIBLE_MS = 3500;

interface IMandatoryActionHintBannerProps {
  hint: string | null;
}

export function MandatoryActionHintBanner({ hint }: IMandatoryActionHintBannerProps) {
  // Guardamos el aviso ya "consumido" para ocultarlo. La visibilidad es derivada, así evitamos
  // llamar a setState de forma síncrona dentro del efecto (solo se difiere en el setTimeout).
  const [dismissedHint, setDismissedHint] = useState<string | null>(null);

  useEffect(() => {
    if (!hint) return;
    const timer = setTimeout(() => setDismissedHint(hint), VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [hint]);

  const isVisible = Boolean(hint) && hint !== dismissedHint;

  return (
    <AnimatePresence>
      {hint && isVisible ? (
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.3 }}
          // Arriba del todo, compacto y sin capturar clics: el jugador puede seleccionar las
          // cartas resaltadas aunque el aviso siga visible, y desaparece solo en unos segundos.
          className="pointer-events-none absolute left-1/2 top-[5%] z-[155] w-[92%] max-w-xl -translate-x-1/2 rounded-xl border border-amber-300/60 bg-amber-950/90 px-4 py-2.5 text-center text-amber-100 shadow-[0_0_35px_rgba(251,191,36,0.28)]"
        >
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-amber-300">Acción obligatoria</p>
          <p className="mt-0.5 text-sm font-bold leading-tight sm:text-base">{hint}</p>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
