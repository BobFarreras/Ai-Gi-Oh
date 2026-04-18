// src/components/hub/internal/HubProfileNameDialog.tsx - Diálogo modal para editar nickname de operador desde HUD del Hub.
"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { createPortal } from "react-dom";

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
  const [isMounted, setIsMounted] = useState(false);
  const isValidLength = value.trim().length >= 3 && value.trim().length <= 24;
  const isSaveDisabled = isSaving || !isValidLength;
  const helperText = useMemo(() => `${value.trim().length}/24`, [value]);

  useEffect(() => {
    if (isOpen) setValue(currentLabel);
  }, [currentLabel, isOpen]);

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSave(value.trim());
    onClose();
  };

  if (!isMounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          className="fixed inset-0 z-[780] flex items-center justify-center bg-black/65 px-4 backdrop-blur-[2px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 40, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
            onClick={(event) => event.stopPropagation()}
            className="relative w-full max-w-md overflow-hidden border border-cyan-400/55 bg-[#020a15]/95 p-4 shadow-[0_0_40px_rgba(6,182,212,0.28)] sm:p-5"
            style={{ clipPath: "polygon(16px 0, 100% 0, 100% calc(100% - 16px), calc(100% - 16px) 100%, 0 100%, 0 16px)" }}
          >
            <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.2),transparent_60%)]" />
            <div aria-hidden className="pointer-events-none absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.2)_50%)] bg-[length:100%_4px] opacity-30" />
            <p className="relative z-10 font-mono text-[11px] font-black uppercase tracking-[0.24em] text-cyan-300">Configurar Operador</p>
            <h3 className="relative z-10 mt-1 text-lg font-black uppercase tracking-[0.08em] text-cyan-50">Identidad de Red</h3>
            <label htmlFor="hub-profile-nickname-input" className="relative z-10 mt-3 block font-mono text-xs uppercase tracking-[0.14em] text-cyan-100/90">
              Nombre de operador
            </label>
            <input
              id="hub-profile-nickname-input"
              aria-label="Nombre de operador"
              autoFocus
              value={value}
              disabled={isSaving}
              onChange={(event) => setValue(event.target.value)}
              className="relative z-10 mt-2 w-full border border-cyan-500/45 bg-black/65 px-3 py-2 font-mono text-sm font-semibold uppercase tracking-[0.08em] text-cyan-50 outline-none transition focus:border-cyan-300 focus:shadow-[0_0_14px_rgba(34,211,238,0.35)]"
              style={{ clipPath: "polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)" }}
              placeholder="NeoOperator"
              minLength={3}
              maxLength={24}
            />
            <div className="relative z-10 mt-1 flex items-center justify-between">
              <p className="text-[11px] font-mono font-semibold uppercase tracking-[0.1em] text-cyan-300/80">3-24 caracteres</p>
              <p className="text-[11px] font-mono font-black uppercase tracking-[0.12em] text-cyan-200">{helperText}</p>
            </div>
            {errorMessage ? <p className="relative z-10 mt-2 text-xs font-semibold text-rose-300">{errorMessage}</p> : null}
            <div className="relative z-10 mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="border border-zinc-600 bg-zinc-900/75 px-3 py-2 font-mono text-xs font-black uppercase tracking-[0.14em] text-zinc-200 transition hover:border-zinc-400"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSaveDisabled}
                className="border border-cyan-500/60 bg-cyan-900/45 px-3 py-2 font-mono text-xs font-black uppercase tracking-[0.14em] text-cyan-100 transition hover:border-cyan-300 disabled:cursor-not-allowed disabled:opacity-55"
              >
                {isSaving ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </motion.form>
        </motion.div>
      ) : null}
    </AnimatePresence>
    ,
    document.body,
  );
}
