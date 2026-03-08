// src/components/game/board/battlefield/internal/ExecutionActivateButton.tsx - Botón flotante para activar una ejecución seleccionada desde el tablero.
"use client";

interface ExecutionActivateButtonProps {
  onActivateSelectedExecution: () => void;
}

export function ExecutionActivateButton({ onActivateSelectedExecution }: ExecutionActivateButtonProps) {
  return (
    <button
      aria-label="Activar ejecución seleccionada"
      onClick={(event) => {
        event.stopPropagation();
        onActivateSelectedExecution();
      }}
      className="absolute -top-10 left-1/2 -translate-x-1/2 z-[120] rounded-md border border-fuchsia-300/80 bg-fuchsia-700/85 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white shadow-[0_0_16px_rgba(217,70,239,0.55)] hover:bg-fuchsia-600"
    >
      Activar
    </button>
  );
}

