// src/components/hub/story/internal/map/components/StoryMapZoomControls.tsx - Controles de zoom del mapa Story para desktop y mobile.
interface IStoryMapZoomControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
}

export function StoryMapZoomControls({ onZoomIn, onZoomOut, onReset }: IStoryMapZoomControlsProps) {
  return (
    <div className="absolute right-3 top-3 z-50 flex items-center gap-1 rounded border border-cyan-500/40 bg-black/70 p-1 text-cyan-100 backdrop-blur-sm">
      <button type="button" aria-label="Acercar mapa" onClick={onZoomIn} className="rounded border border-cyan-500/40 px-2 py-1 text-xs font-black">+</button>
      <button type="button" aria-label="Alejar mapa" onClick={onZoomOut} className="rounded border border-cyan-500/40 px-2 py-1 text-xs font-black">-</button>
      <button type="button" aria-label="Restablecer zoom" onClick={onReset} className="rounded border border-cyan-500/40 px-2 py-1 text-[10px] font-black">1x</button>
    </div>
  );
}
