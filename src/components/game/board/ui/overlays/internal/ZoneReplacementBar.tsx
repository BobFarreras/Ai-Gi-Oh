// src/components/game/board/ui/overlays/internal/ZoneReplacementBar.tsx - Barra del MODO REEMPLAZO: dice qué
// hay que hacer y deja salir.
//
// Antes, el reemplazo se anunciaba con el banner de "acción obligatoria", que se autooculta a los 3,5 s y no
// tiene botones. Resultado: si el jugador se lo pensaba, se quedaba con tres cartas brillando, sin explicación
// y sin forma de cancelar (había que elegir una carta y decir "No" en la confirmación para poder salir). Esta
// barra es persistente mientras dure el modo y siempre ofrece la salida.
"use client";

import { X } from "lucide-react";
import { ReplacementZoneType } from "@/core/use-cases/game-engine/actions/play-card-with-zone-replacement";

interface IZoneReplacementBarProps {
  zone: ReplacementZoneType;
  /** true cuando el jugador aún no ha elegido carta (la confirmación se muestra aparte). */
  isChoosing: boolean;
  onCancel: () => void;
}

export function ZoneReplacementBar({ zone, isChoosing, onCancel }: IZoneReplacementBarProps) {
  const zoneLabel = zone === "ENTITIES" ? "entidades" : "magias/trampas";

  return (
    // z por encima del HUD móvil (z-280) y del overlay de carta (z-320): esta instrucción debe leerse siempre;
    // antes el retrato/HUD del jugador la tapaba en móvil.
    <div className="absolute left-1/2 top-[5%] z-[330] w-[92%] max-w-xl -translate-x-1/2 rounded-xl border border-amber-300/60 bg-amber-950/95 px-3 py-2.5 text-amber-100 shadow-[0_0_35px_rgba(251,191,36,0.28)]">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-amber-300">
            Zona de {zoneLabel} llena
          </p>
          <p className="mt-0.5 text-sm font-bold leading-tight sm:text-base">
            {isChoosing ? "Toca la carta que quieres descartar para hacer sitio." : "Confirma el descarte para colocar la carta nueva."}
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          aria-label="Cancelar el reemplazo"
          // 44px de alto: objetivo táctil cómodo en móvil, que es donde más costaba.
          className="flex h-11 shrink-0 items-center gap-1.5 rounded-lg border border-amber-300/70 bg-amber-500/15 px-3 text-xs font-black uppercase tracking-[0.1em] text-amber-100 transition hover:bg-amber-500/30"
        >
          <X className="h-4 w-4" />
          Cancelar
        </button>
      </div>
    </div>
  );
}
