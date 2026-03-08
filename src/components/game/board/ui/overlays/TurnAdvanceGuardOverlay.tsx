// src/components/game/board/ui/overlays/TurnAdvanceGuardOverlay.tsx - Confirmación contextual para evitar saltos accidentales de fase con opción persistente.
"use client";

import { useState } from "react";

interface TurnAdvanceGuardOverlayProps {
  warning: "MAIN_SKIP_ACTIONS" | "BATTLE_SKIP_ATTACKS" | null;
  onConfirm: (disableHelp: boolean) => void;
  onCancel: () => void;
}

const WARNING_TEXT: Record<"MAIN_SKIP_ACTIONS" | "BATTLE_SKIP_ATTACKS", { title: string; message: string }> = {
  MAIN_SKIP_ACTIONS: {
    title: "Aún puedes jugar cartas",
    message: "Todavía tienes acciones posibles en Invocación. Si continúas, pasarás a Combate igualmente.",
  },
  BATTLE_SKIP_ATTACKS: {
    title: "Aún tienes ataques disponibles",
    message: "Todavía puedes atacar o preparar otra entidad para atacar. Si continúas, pasarás turno al rival.",
  },
};

export function TurnAdvanceGuardOverlay({ warning, onConfirm, onCancel }: TurnAdvanceGuardOverlayProps) {
  const [disableHelp, setDisableHelp] = useState(false);
  if (!warning) return null;
  const text = WARNING_TEXT[warning];
  return (
    <div className="absolute inset-0 z-[166] flex items-center justify-center bg-black/45 px-4">
      <div className="w-full max-w-lg rounded-2xl border border-cyan-500/40 bg-zinc-950/95 p-5 shadow-[0_0_36px_rgba(34,211,238,0.25)]">
        <h3 className="text-lg font-black uppercase tracking-wide text-cyan-200">{text.title}</h3>
        <p className="mt-2 text-sm text-zinc-200">{text.message}</p>
        <label className="mt-4 flex cursor-pointer items-center gap-2 text-xs font-semibold text-zinc-300">
          <input
            type="checkbox"
            checked={disableHelp}
            onChange={(event) => setDisableHelp(event.target.checked)}
            className="h-4 w-4 rounded border-zinc-600 bg-zinc-900"
          />
          No volver a mostrar estos avisos
        </label>
        <div className="mt-5 flex justify-end gap-2">
          <button
            aria-label="Volver atrás y mantener fase actual"
            onClick={onCancel}
            className="rounded-lg border border-zinc-600 bg-zinc-900 px-4 py-2 text-xs font-black uppercase tracking-wider text-zinc-200"
          >
            Volver
          </button>
          <button
            aria-label="Continuar y avanzar de fase"
            onClick={() => onConfirm(disableHelp)}
            className="rounded-lg border border-emerald-400/60 bg-emerald-950/60 px-4 py-2 text-xs font-black uppercase tracking-wider text-emerald-200"
          >
            Continuar
          </button>
        </div>
      </div>
    </div>
  );
}
