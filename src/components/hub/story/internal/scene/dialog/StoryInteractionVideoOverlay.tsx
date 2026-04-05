// src/components/hub/story/internal/scene/dialog/StoryInteractionVideoOverlay.tsx - Overlay de cinemática Story a pantalla completa con cierre flotante opcional.
"use client";

import { AnimatePresence, motion } from "framer-motion";
import { IStoryInteractionCinematicVideo } from "@/services/story/story-node-interaction-dialogue-types";

interface IStoryInteractionVideoOverlayProps {
  isOpen: boolean;
  cinematicVideo: IStoryInteractionCinematicVideo | null;
  onClose: () => void;
}

/**
 * Reproduce vídeo narrativo full-screen sin acoplar el resto del diálogo ni la lógica del mapa.
 */
export function StoryInteractionVideoOverlay({
  isOpen,
  cinematicVideo,
  onClose,
}: IStoryInteractionVideoOverlayProps) {
  if (!cinematicVideo) return null;
  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-[70] bg-black/95 md:bg-black/90 md:backdrop-blur-sm"
        >
          <div className="absolute inset-0 flex items-center justify-center p-0 md:p-8">
            <div className="relative h-full w-full overflow-hidden md:h-auto md:max-h-[88vh] md:max-w-[1280px] md:rounded-2xl md:border md:border-cyan-300/45 md:bg-zinc-950 md:shadow-[0_0_50px_rgba(34,211,238,0.2)]">
              <div className="hidden h-9 items-center gap-2 border-b border-cyan-300/20 bg-zinc-900/95 px-4 md:flex">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                <span className="ml-3 text-[10px] font-bold uppercase tracking-[0.14em] text-cyan-100/85">Story Terminal / Cinemática</span>
              </div>
              <video
                className="h-full w-full object-cover md:aspect-video md:h-auto md:max-h-[calc(88vh-2.25rem)]"
                src={cinematicVideo.videoUrl}
                poster={cinematicVideo.posterUrl}
                autoPlay={cinematicVideo.autoPlay ?? true}
                loop={cinematicVideo.loop ?? false}
                playsInline
                controls={false}
                onEnded={onClose}
              />
            </div>
          </div>
          <button
            type="button"
            aria-label={cinematicVideo.skipLabel ?? "Interrumpir vídeo"}
            onClick={onClose}
            className="absolute right-4 top-4 z-20 rounded-full border border-cyan-400/80 bg-black/70 px-4 py-2 text-[11px] font-black uppercase tracking-[0.14em] text-cyan-100 shadow-[0_0_18px_rgba(34,211,238,0.35)] md:right-8 md:top-7"
          >
            {cinematicVideo.skipLabel ?? "Interrumpir vídeo"}
          </button>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
