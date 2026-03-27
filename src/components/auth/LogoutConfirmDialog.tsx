// src/components/auth/LogoutConfirmDialog.tsx - Diálogo visual de confirmación para cerrar sesión con estilo del juego.
"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";

interface LogoutConfirmDialogProps {
  isOpen: boolean;
  isPending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function LogoutConfirmDialog({ isOpen, isPending, onCancel, onConfirm }: LogoutConfirmDialogProps) {
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      // Permite cerrar rápido el diálogo sin depender de click/tap.
      if (event.key === "Escape" && !isPending) onCancel();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, isPending, onCancel]);

  if (!isOpen) return null;
  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="logout-dialog-title"
        className="relative w-full max-w-md border border-red-400/50 bg-[#0a0306]/95 p-4 shadow-[0_0_30px_rgba(248,113,113,0.25)] sm:p-5"
        style={{ clipPath: "polygon(14px 0,100% 0,100% calc(100% - 14px),calc(100% - 14px) 100%,0 100%,0 14px)" }}
      >
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(248,113,113,0.08)_50%)] bg-[length:100%_4px] opacity-50" />
        <h2 id="logout-dialog-title" className="font-mono text-sm font-black uppercase tracking-[0.18em] text-red-200 sm:text-base">
          Confirmar Desconexión
        </h2>
        <p className="mt-3 text-sm text-red-100/90">
          Vas a cerrar sesión y salir del Hub. ¿Quieres continuar?
        </p>
        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            aria-label="Cancelar cierre de sesión"
            onClick={onCancel}
            disabled={isPending}
            className="border border-zinc-500/50 bg-zinc-900/70 px-3 py-2 font-mono text-xs font-bold uppercase tracking-[0.14em] text-zinc-200 transition hover:border-zinc-300 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            aria-label="Confirmar cierre de sesión"
            onClick={onConfirm}
            disabled={isPending}
            className="border border-red-400/60 bg-red-950/70 px-3 py-2 font-mono text-xs font-black uppercase tracking-[0.14em] text-red-100 transition hover:border-red-300 disabled:opacity-50"
          >
            {isPending ? "Cerrando..." : "Sí, salir"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
