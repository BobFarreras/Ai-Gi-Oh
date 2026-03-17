// src/components/hub/story/internal/map/components/StoryMapZoomControls.tsx - Botón rápido para centrar cámara en el nodo actual del jugador.
interface IStoryMapZoomControlsProps {
  onCenterPlayerNode: () => void;
  onExitToHub?: () => void;
}

export function StoryMapZoomControls({ onCenterPlayerNode, onExitToHub }: IStoryMapZoomControlsProps) {
  return (
    <div className="absolute right-3 top-3 z-50 flex items-center gap-1 rounded border border-cyan-500/40 bg-black/70 p-1 text-cyan-100 backdrop-blur-sm">
      <button
        type="button"
        aria-label="Centrar en el jugador"
        onClick={onCenterPlayerNode}
        className="rounded border border-cyan-500/40 p-2 text-[10px] font-black uppercase tracking-wider"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
        </svg>
      </button>
      {onExitToHub ? (
        <button
          type="button"
          aria-label="Volver al hub"
          onClick={onExitToHub}
          className="rounded border border-cyan-500/40 px-2 py-2 text-[10px] font-black uppercase tracking-wider"
        >
          Hub
        </button>
      ) : null}
    </div>
  );
}
