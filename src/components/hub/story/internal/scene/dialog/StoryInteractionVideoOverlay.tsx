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
          className="absolute inset-0 z-[70] bg-black"
        >
          <video
            className="h-full w-full object-cover"
            src={cinematicVideo.videoUrl}
            poster={cinematicVideo.posterUrl}
            autoPlay={cinematicVideo.autoPlay ?? true}
            loop={cinematicVideo.loop ?? false}
            playsInline
            controls={false}
            onEnded={onClose}
          />
          <button
            type="button"
            aria-label={cinematicVideo.skipLabel ?? "Interrumpir vídeo"}
            onClick={onClose}
            className="absolute right-4 top-4 z-20 rounded-full border border-cyan-400/80 bg-black/70 px-4 py-2 text-[11px] font-black uppercase tracking-[0.14em] text-cyan-100 shadow-[0_0_18px_rgba(34,211,238,0.35)]"
          >
            {cinematicVideo.skipLabel ?? "Interrumpir vídeo"}
          </button>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
