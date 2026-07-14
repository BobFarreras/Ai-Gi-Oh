// src/components/game/board/ui/overlays/EntityReplacementConfirmOverlay.tsx - Pide confirmación antes de sacrificar una entidad para reemplazarla por otra desde la mano.
import { ICard } from "@/core/entities/ICard";
import { ReplacementZoneType } from "@/core/use-cases/game-engine/actions/play-card-with-zone-replacement";

interface EntityReplacementConfirmOverlayProps {
  zone: ReplacementZoneType;
  targetCard: ICard | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export function EntityReplacementConfirmOverlay({ zone, targetCard, onConfirm, onCancel }: EntityReplacementConfirmOverlayProps) {
  if (!targetCard) return null;
  const zoneLabel = zone === "ENTITIES" ? "entidad" : "ejecución";

  // Sin `backdrop-blur`: un filtro de desenfoque a pantalla completa es de lo más caro que se puede pedir a un
  // móvil, y aquí solo aportaba 1,5 px que apenas se veían. Un velo opaco da el mismo contraste gratis.
  return (
    <div className="absolute inset-0 z-[160] flex items-center justify-center bg-black/70 px-3">
      <div className="w-full max-w-xl border border-amber-300/60 bg-zinc-950/97 px-5 py-5 shadow-[0_0_45px_rgba(251,191,36,0.32)] sm:px-6">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-amber-300">Reemplazo de zona</p>
        <h3 className="mt-2 text-lg font-black uppercase text-white sm:text-xl">¿Descartar esta carta?</h3>
        <p className="mt-2 text-sm text-zinc-200">
          La {zoneLabel} <span className="font-black text-amber-200">{targetCard.name}</span> irá al cementerio para dejar sitio a la carta nueva. No se puede deshacer.
        </p>
        {/* En móvil los botones van a ancho completo y apilados: son la acción destructiva de la pantalla y
            fallar el toque aquí significa descartar la carta equivocada. */}
        <div className="mt-5 flex flex-col-reverse gap-2.5 sm:flex-row sm:items-center sm:justify-end sm:gap-3">
          <button
            aria-label="Cancelar el reemplazo"
            onClick={(event) => {
              event.stopPropagation();
              onCancel();
            }}
            className="min-h-[48px] w-full border border-zinc-500/70 px-5 text-sm font-black uppercase tracking-wide text-zinc-200 hover:border-zinc-300 hover:text-white sm:w-auto"
          >
            Cancelar
          </button>
          <button
            aria-label="Confirmar el reemplazo"
            onClick={(event) => {
              event.stopPropagation();
              onConfirm();
            }}
            className="min-h-[48px] w-full border border-amber-300/80 bg-amber-500/20 px-5 text-sm font-black uppercase tracking-wide text-amber-100 hover:bg-amber-500/35 sm:w-auto"
          >
            Descartar y colocar
          </button>
        </div>
      </div>
    </div>
  );
}
