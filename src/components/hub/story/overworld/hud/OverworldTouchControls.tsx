// src/components/hub/story/overworld/hud/OverworldTouchControls.tsx - D-pad y botón de acción táctiles con estética cibernética (pointer events, cross-device).
"use client";

import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Zap, type LucideIcon } from "lucide-react";
import { OverworldDirection } from "@/core/services/story/overworld/overworld-types";

interface IOverworldTouchControlsProps {
  onDirectionDown: (direction: OverworldDirection) => void;
  onDirectionUp: () => void;
  onAction: () => void;
}

/** Recorte octagonal "tech" reutilizado por las teclas. */
const OCTAGON = "polygon(30% 0, 70% 0, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0 70%, 0 30%)";

const DPAD_BUTTONS: Array<{ direction: OverworldDirection; Icon: LucideIcon; className: string }> = [
  { direction: "UP", Icon: ChevronUp, className: "col-start-2 row-start-1" },
  { direction: "LEFT", Icon: ChevronLeft, className: "col-start-1 row-start-2" },
  { direction: "RIGHT", Icon: ChevronRight, className: "col-start-3 row-start-2" },
  { direction: "DOWN", Icon: ChevronDown, className: "col-start-2 row-start-3" },
];

/**
 * Controles táctiles cibernéticos para dispositivos con puntero grueso (táctil): D-pad octagonal
 * con glow cian y botón de acción esmeralda. En escritorio (puntero fino) se ocultan y manda el
 * teclado. El padding inferior respeta la `safe-area` para que la barra del móvil no los tape.
 */
export function OverworldTouchControls({
  onDirectionDown,
  onDirectionUp,
  onAction,
}: IOverworldTouchControlsProps) {
  return (
    <div
      className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex select-none items-end justify-between p-4 sm:p-6 [@media(pointer:fine)]:hidden"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 1rem)" }}
    >
      <div className="pointer-events-auto grid grid-cols-3 grid-rows-3 gap-1.5" style={{ touchAction: "none" }}>
        {DPAD_BUTTONS.map(({ direction, Icon, className }) => (
          <button
            key={direction}
            type="button"
            aria-label={`Mover ${direction}`}
            className={`${className} flex h-14 w-14 items-center justify-center border border-cyan-400/50 bg-gradient-to-br from-slate-900/85 to-cyan-950/70 text-cyan-200 shadow-[0_0_14px_rgba(34,211,238,0.25),inset_0_0_10px_rgba(34,211,238,0.12)] backdrop-blur-sm transition-all active:border-cyan-200 active:text-white active:shadow-[0_0_22px_rgba(34,211,238,0.55),inset_0_0_14px_rgba(34,211,238,0.3)]`}
            style={{ clipPath: OCTAGON, touchAction: "none" }}
            onPointerDown={(event) => {
              event.preventDefault();
              event.currentTarget.setPointerCapture(event.pointerId);
              onDirectionDown(direction);
            }}
            onPointerUp={onDirectionUp}
            onPointerCancel={onDirectionUp}
            onLostPointerCapture={onDirectionUp}
          >
            <Icon size={24} strokeWidth={2.75} className="drop-shadow-[0_0_6px_rgba(34,211,238,0.85)]" />
          </button>
        ))}
      </div>
      <button
        type="button"
        aria-label="Interactuar"
        className="group pointer-events-auto relative flex h-20 w-20 items-center justify-center border-2 border-emerald-300/60 bg-gradient-to-br from-emerald-400/30 to-emerald-950/60 text-emerald-50 shadow-[0_0_24px_rgba(16,185,129,0.4),inset_0_0_16px_rgba(16,185,129,0.22)] backdrop-blur-sm transition-all active:scale-95 active:shadow-[0_0_32px_rgba(16,185,129,0.75),inset_0_0_20px_rgba(16,185,129,0.4)]"
        style={{ clipPath: OCTAGON, touchAction: "none" }}
        onPointerDown={(event) => {
          event.preventDefault();
          onAction();
        }}
      >
        {/* Anillo interior para dar profundidad de "botón de consola". */}
        <span
          className="pointer-events-none absolute inset-[6px] border border-emerald-300/40"
          style={{ clipPath: OCTAGON }}
        />
        <Zap
          size={30}
          strokeWidth={2.25}
          className="relative fill-emerald-300/25 text-emerald-100 drop-shadow-[0_0_10px_rgba(16,185,129,0.95)] transition-transform group-active:scale-110"
        />
      </button>
    </div>
  );
}
