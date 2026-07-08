// src/components/hub/story/overworld/hud/OverworldKeyboardHints.tsx - Ayuda de teclado (WASD + Espacio) para escritorio, difuminada abajo-izquierda.
"use client";

import { ReactNode } from "react";

/** Tecla estilo keycap. */
function Kbd({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  return (
    <span
      className={`inline-flex h-7 items-center justify-center rounded-md border border-cyan-300/30 bg-slate-900/70 text-[11px] font-black uppercase tracking-wider text-cyan-100 shadow-[inset_0_-2px_0_rgba(0,0,0,0.4)] ${
        wide ? "px-4" : "w-7"
      }`}
    >
      {children}
    </span>
  );
}

/**
 * Recordatorio de controles para escritorio (puntero fino): W/A/S/D para moverse y Espacio
 * para interactuar. Se muestra difuminado en la esquina inferior izquierda y se oculta en
 * dispositivos táctiles (allí manda el D-pad).
 */
export function OverworldKeyboardHints() {
  return (
    <div className="pointer-events-none absolute bottom-4 left-4 z-20 hidden select-none flex-col gap-2 opacity-45 transition-opacity hover:opacity-80 [@media(pointer:fine)]:flex">
      <div className="flex flex-col items-center gap-1">
        <Kbd>W</Kbd>
        <div className="flex gap-1">
          <Kbd>A</Kbd>
          <Kbd>S</Kbd>
          <Kbd>D</Kbd>
        </div>
        <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-cyan-200/70">Mover</span>
      </div>
      <div className="flex items-center gap-2">
        <Kbd wide>Espacio</Kbd>
        <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-cyan-200/70">Interactuar</span>
      </div>
    </div>
  );
}
