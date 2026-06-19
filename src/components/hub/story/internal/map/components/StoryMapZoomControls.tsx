// src/components/hub/story/internal/map/components/StoryMapZoomControls.tsx - Controles flotantes Story para centrar cámara y mutear soundtrack del mapa.
import { ArrowLeft, Loader2, LocateFixed, Minus, Plus, Volume2, VolumeX } from "lucide-react";

interface IStoryMapZoomControlsProps {
  onCenterPlayerNode: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  isSoundtrackMuted: boolean;
  onToggleSoundtrackMute: () => void;
  isMobileVerticalFlow?: boolean;
  onExitToHub?: () => void;
  isExiting?: boolean;
}

export function StoryMapZoomControls({
  onCenterPlayerNode,
  onZoomIn,
  onZoomOut,
  isSoundtrackMuted,
  onToggleSoundtrackMute,
  isMobileVerticalFlow = false,
  onExitToHub,
  isExiting = false,
}: IStoryMapZoomControlsProps) {
  if (isMobileVerticalFlow) {
    return (
      <div className="absolute left-3 top-[calc(env(safe-area-inset-top)+10px)] z-[60] flex items-center gap-2">
        <button
          type="button"
          aria-label="Salir al hub"
          onClick={onExitToHub}
          disabled={isExiting}
          className="rounded-lg border border-rose-400/65 bg-zinc-950/90 p-2.5 text-rose-100 shadow-[0_0_14px_rgba(244,63,94,0.3)] disabled:opacity-50 transition-opacity"
        >
          {isExiting ? <Loader2 size={18} className="animate-spin" /> : <ArrowLeft size={18} />}
        </button>
        <button
          type="button"
          aria-label={isSoundtrackMuted ? "Activar sonido del mapa" : "Silenciar sonido del mapa"}
          onClick={onToggleSoundtrackMute}
          className="rounded-lg border border-cyan-500/55 bg-zinc-950/90 p-2.5 text-cyan-200 shadow-[0_0_12px_rgba(34,211,238,0.25)]"
        >
          {isSoundtrackMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>
        <button
          type="button"
          aria-label="Alejar"
          onClick={onZoomOut}
          className="rounded-lg border border-zinc-500/60 bg-zinc-950/90 p-2.5 text-zinc-200 shadow-[0_0_10px_rgba(255,255,255,0.08)]"
        >
          <Minus size={18} />
        </button>
        <button
          type="button"
          aria-label="Acercar"
          onClick={onZoomIn}
          className="rounded-lg border border-zinc-500/60 bg-zinc-950/90 p-2.5 text-zinc-200 shadow-[0_0_10px_rgba(255,255,255,0.08)]"
        >
          <Plus size={18} />
        </button>
        <button
          type="button"
          aria-label="Centrar en el jugador"
          onClick={onCenterPlayerNode}
          className="rounded-lg border border-emerald-500/60 bg-zinc-950/90 p-2.5 text-emerald-200 shadow-[0_0_12px_rgba(16,185,129,0.25)]"
        >
          <LocateFixed size={18} />
        </button>
      </div>
    );
  }

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
        aria-label="Alejar"
        onClick={onZoomOut}
        className="bg-zinc-950/90 border-2 border-zinc-500/50 text-zinc-300 p-4 rounded-full hover:bg-zinc-800 hover:shadow-[0_0_16px_rgba(255,255,255,0.2)] transition-all"
      >
        <Minus size={24} />
      </button>
      <button
        type="button"
        aria-label="Acercar"
        onClick={onZoomIn}
        className="bg-zinc-950/90 border-2 border-zinc-500/50 text-zinc-300 p-4 rounded-full hover:bg-zinc-800 hover:shadow-[0_0_16px_rgba(255,255,255,0.2)] transition-all"
      >
        <Plus size={24} />
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
