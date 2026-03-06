// src/components/game/board/ui/overlays/EntityReplacementConfirmOverlay.tsx - Pide confirmación antes de sacrificar una entidad para reemplazarla por otra desde la mano.
import { ICard } from "@/core/entities/ICard";

interface EntityReplacementConfirmOverlayProps {
  targetCard: ICard | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export function EntityReplacementConfirmOverlay({ targetCard, onConfirm, onCancel }: EntityReplacementConfirmOverlayProps) {
  if (!targetCard) return null;

  return (
    <div className="absolute inset-0 z-[160] flex items-center justify-center bg-black/60 backdrop-blur-[1.5px]">
      <div className="w-[92%] max-w-xl border border-amber-300/60 bg-zinc-950/94 px-6 py-5 shadow-[0_0_45px_rgba(251,191,36,0.32)]">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-amber-300">Reemplazo de entidad</p>
        <h3 className="mt-2 text-xl font-black text-white uppercase">¿Estás seguro de eliminar esta carta?</h3>
        <p className="mt-2 text-sm text-zinc-200">
          La carta <span className="font-black text-amber-200">{targetCard.name}</span> irá al cementerio para invocar la nueva entidad.
        </p>
        <div className="mt-5 flex items-center justify-end gap-3">
          <button
            aria-label="Cancelar reemplazo de entidad"
            onClick={(event) => {
              event.stopPropagation();
              onCancel();
            }}
            className="border border-zinc-500/70 px-4 py-2 text-sm font-black uppercase tracking-wide text-zinc-200 hover:border-zinc-300 hover:text-white"
          >
            No
          </button>
          <button
            aria-label="Confirmar reemplazo de entidad"
            onClick={(event) => {
              event.stopPropagation();
              onConfirm();
            }}
            className="border border-amber-300/80 bg-amber-500/20 px-4 py-2 text-sm font-black uppercase tracking-wide text-amber-100 hover:bg-amber-500/35"
          >
            Sí
          </button>
        </div>
      </div>
    </div>
  );
}
