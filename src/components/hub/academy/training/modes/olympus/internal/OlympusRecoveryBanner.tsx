// src/components/hub/academy/training/modes/olympus/internal/OlympusRecoveryBanner.tsx - Ofrece una salida accesible ante bloqueos de Olimpo.
interface IOlympusRecoveryBannerProps {
  error: string;
  isLoading: boolean;
  onReset: () => void;
}

/** Explica que restaurar cierra el intento actual antes de volver a la selección. */
export function OlympusRecoveryBanner({ error, isLoading, onReset }: IOlympusRecoveryBannerProps) {
  return (
    <div role="alert" className="fixed inset-x-4 top-4 z-[200] mx-auto max-w-xl rounded-xl border border-rose-400/50 bg-rose-950/95 p-4 text-center text-sm font-bold text-rose-100">
      <p>{error}</p>
      <p className="mt-2 text-xs font-medium text-rose-200">
        Restaurar cerrará este combate como derrota. El intento ya consumido no se descontará otra vez.
      </p>
      <button
        type="button"
        disabled={isLoading}
        onClick={onReset}
        className="mt-3 rounded-lg border border-rose-200/60 bg-rose-100 px-4 py-2 text-xs font-black uppercase tracking-wider text-rose-950 disabled:cursor-wait disabled:opacity-60"
      >
        {isLoading ? "Restaurando…" : "Restaurar Olimpo"}
      </button>
    </div>
  );
}
