// src/components/hub/home/HomeErrorBanner.tsx - Banner visual para mostrar errores funcionales del módulo Mi Home.
interface HomeErrorBannerProps {
  message: string | null;
  onClose: () => void;
}

export function HomeErrorBanner({ message, onClose }: HomeErrorBannerProps) {
  if (!message) {
    return null;
  }

  return (
    <div className="flex items-start justify-between rounded-xl border border-rose-400/55 bg-rose-500/15 px-4 py-3">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.2em] text-rose-200">Error de Mi Home</p>
        <p className="mt-1 text-sm text-rose-100">{message}</p>
      </div>
      <button
        type="button"
        aria-label="Cerrar banner de error"
        onClick={onClose}
        className="rounded border border-rose-300/40 px-2 py-1 text-[11px] font-bold uppercase text-rose-100 hover:bg-rose-400/20"
      >
        Cerrar
      </button>
    </div>
  );
}
