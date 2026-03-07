// src/components/hub/internal/HubErrorDialog.tsx - Diálogo global de error para módulos del Hub con autocierre y sonido común.
"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";
import { useEffect } from "react";
import { useHubModuleSfx } from "@/components/hub/internal/use-hub-module-sfx";

interface HubErrorDialogProps {
  message: string | null;
  title: string;
  onClose: () => void;
  autoCloseMs?: number;
}

export function HubErrorDialog({ message, title, onClose, autoCloseMs = 4000 }: HubErrorDialogProps) {
  const { play } = useHubModuleSfx();

  useEffect(() => {
    if (!message) return;
    play("ERROR_COMMON");
    const timerId = window.setTimeout(() => onClose(), autoCloseMs);
    return () => window.clearTimeout(timerId);
  }, [autoCloseMs, message, onClose, play]);

  return (
    <AnimatePresence>
      {message ? (
        <motion.div
          className="pointer-events-none fixed inset-0 z-[650] flex items-start justify-center px-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-5 sm:pt-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            role="dialog"
            aria-live="assertive"
            aria-label={title}
            initial={{ opacity: 0, y: -18, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.96 }}
            transition={{ duration: 0.24, ease: "easeOut" }}
            className="pointer-events-auto relative w-full max-w-xl overflow-hidden rounded-xl border border-rose-400/60 bg-[linear-gradient(140deg,rgba(68,7,7,0.92),rgba(30,9,9,0.94))] p-3 text-rose-100 shadow-[0_0_30px_rgba(244,63,94,0.24)] sm:p-4"
          >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(251,113,133,0.2),transparent_60%)]" />
            <div className="relative flex items-start gap-3 pr-9">
              <span className="mt-0.5 rounded-md border border-rose-300/45 bg-rose-500/20 p-1.5">
                <AlertTriangle size={16} className="text-rose-100" />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-rose-200">{title}</p>
                <p className="mt-1 text-sm font-semibold text-rose-50">{message}</p>
              </div>
            </div>
            <button
              type="button"
              aria-label="Cerrar diálogo de error"
              onClick={onClose}
              className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-md border border-rose-300/45 bg-rose-950/50 text-rose-100 transition-colors hover:bg-rose-500/30"
            >
              <X size={14} />
            </button>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
