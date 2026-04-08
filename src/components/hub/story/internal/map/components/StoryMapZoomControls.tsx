// src/components/hub/story/internal/map/components/StoryMapZoomControls.tsx - Controles flotantes Story para centrar cámara y mutear soundtrack del mapa.
import { LocateFixed, Volume2, VolumeX } from "lucide-react";

interface IStoryMapZoomControlsProps {
  onCenterPlayerNode: () => void;
  isSoundtrackMuted: boolean;
  onToggleSoundtrackMute: () => void;
}

export function StoryMapZoomControls({
  onCenterPlayerNode,
  isSoundtrackMuted,
  onToggleSoundtrackMute,
}: IStoryMapZoomControlsProps) {
  return (
    <div className="absolute bottom-6 right-6 z-50 flex items-center gap-3">
      <button
        type="button"
        aria-label={isSoundtrackMuted ? "Activar sonido del mapa" : "Silenciar sonido del mapa"}
        onClick={onToggleSoundtrackMute}
        className="bg-zinc-950/90 border-2 border-cyan-500/50 text-cyan-300 p-4 rounded-full hover:bg-cyan-950 hover:shadow-[0_0_20px_rgba(34,211,238,0.6)] transition-all"
      >
        {isSoundtrackMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
      </button>
      <button
        type="button"
        aria-label="Centrar en el jugador"
        onClick={onCenterPlayerNode}
        className="bg-zinc-950/90 border-2 border-emerald-500/60 text-emerald-300 p-4 rounded-full hover:bg-emerald-950 hover:shadow-[0_0_20px_rgba(16,185,129,0.6)] transition-all"
      >
        <LocateFixed size={24} />
      </button>
    </div>
  );
}
