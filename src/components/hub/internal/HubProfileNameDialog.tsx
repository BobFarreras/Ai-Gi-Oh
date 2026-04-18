// src/components/hub/internal/HubProfileNameDialog.tsx - Diálogo modal para editar nickname de operador desde HUD del Hub.
"use client";

import { FormEvent, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface HubProfileNameDialogProps {
  isOpen: boolean;
  currentLabel: string;
  isSaving: boolean;
  errorMessage: string | null;
  onClose: () => void;
  onSave: (nextLabel: string) => Promise<void>;
}

/**
 * Muestra editor de nickname con validación básica y guardado asíncrono.
 */
export function HubProfileNameDialog({
  isOpen,
  currentLabel,
  isSaving,
  errorMessage,
  onClose,
  onSave,
}: HubProfileNameDialogProps) {
  const [value, setValue] = useState(currentLabel);

  useEffect(() => {
    if (isOpen) setValue(currentLabel);
  }, [currentLabel, isOpen]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSave(value);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          className="fixed inset-0 z-[620] flex items-center justify-center bg-black/55 px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            className="w-full max-w-md rounded-xl border border-cyan-500/55 bg-[#030d19]/95 p-4 shadow-[0_0_36px_rgba(6,182,212,0.2)]"
          >
            <p className="font-mono text-[11px] font-black uppercase tracking-[0.2em] text-cyan-300">Editar Operador</p>
            <label htmlFor="hub-profile-nickname-input" className="mt-3 block font-mono text-xs uppercase tracking-[0.14em] text-cyan-100/90">
              Nombre de operador
            </label>
            <input
              id="hub-profile-nickname-input"
              aria-label="Nombre de operador"
              value={value}
              disabled={isSaving}
              onChange={(event) => setValue(event.target.value)}
              className="mt-2 w-full rounded-md border border-cyan-500/45 bg-black/55 px-3 py-2 text-sm font-semibold text-cyan-50 outline-none transition focus:border-cyan-300"
              placeholder="NeoOperator"
              minLength={3}
              maxLength={24}
            />
            {errorMessage ? <p className="mt-2 text-xs font-semibold text-rose-300">{errorMessage}</p> : null}
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="rounded-md border border-zinc-600 bg-zinc-900/70 px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] text-zinc-200 transition hover:border-zinc-400"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="rounded-md border border-cyan-500/60 bg-cyan-900/45 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-cyan-100 transition hover:border-cyan-300"
              >
                {isSaving ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </motion.form>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

