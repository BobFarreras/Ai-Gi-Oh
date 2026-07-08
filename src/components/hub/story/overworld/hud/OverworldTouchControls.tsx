// src/components/hub/story/overworld/hud/OverworldTouchControls.tsx - D-pad y botón de acción táctiles (pointer events, cross-device).
"use client";

import { OverworldDirection } from "@/core/services/story/overworld/overworld-types";

interface IOverworldTouchControlsProps {
  onDirectionDown: (direction: OverworldDirection) => void;
  onDirectionUp: () => void;
  onAction: () => void;
}

const DPAD_BUTTONS: Array<{ direction: OverworldDirection; label: string; className: string }> = [
  { direction: "UP", label: "▲", className: "col-start-2 row-start-1" },
  { direction: "LEFT", label: "◀", className: "col-start-1 row-start-2" },
  { direction: "RIGHT", label: "▶", className: "col-start-3 row-start-2" },
  { direction: "DOWN", label: "▼", className: "col-start-2 row-start-3" },
];

/**
 * Controles táctiles para móvil/pantallas sin teclado. Usa pointer events para
 * cubrir ratón, táctil y lápiz por igual. Se ocultan en escritorio vía CSS.
 */
export function OverworldTouchControls({
  onDirectionDown,
  onDirectionUp,
  onAction,
}: IOverworldTouchControlsProps) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex select-none items-end justify-between p-4 sm:p-6">
      <div className="pointer-events-auto grid grid-cols-3 grid-rows-3 gap-1.5" style={{ touchAction: "none" }}>
        {DPAD_BUTTONS.map((button) => (
          <button
            key={button.direction}
            type="button"
            aria-label={`Mover ${button.direction}`}
            className={`${button.className} flex h-14 w-14 items-center justify-center rounded-xl border border-cyan-300/30 bg-slate-900/70 text-lg text-cyan-100 backdrop-blur-sm active:bg-cyan-400/25`}
            onPointerDown={(event) => {
              event.preventDefault();
              event.currentTarget.setPointerCapture(event.pointerId);
              onDirectionDown(button.direction);
            }}
            onPointerUp={onDirectionUp}
            onPointerCancel={onDirectionUp}
            onLostPointerCapture={onDirectionUp}
          >
            {button.label}
          </button>
        ))}
      </div>
      <button
        type="button"
        aria-label="Acción"
        className="pointer-events-auto flex h-20 w-20 items-center justify-center rounded-full border border-emerald-300/40 bg-emerald-500/25 text-lg font-black uppercase tracking-widest text-emerald-100 backdrop-blur-sm active:bg-emerald-400/40"
        style={{ touchAction: "none" }}
        onPointerDown={(event) => {
          event.preventDefault();
          onAction();
        }}
      >
        A
      </button>
    </div>
  );
}
