// src/components/hub/story/internal/scene/dialog/StoryInteractionVideoOverlay.tsx - Overlay de cinemática Story a pantalla completa con cierre flotante opcional.
"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { IStoryInteractionCinematicVideo } from "@/services/story/story-node-interaction-dialogue-types";

interface IStoryInteractionVideoOverlayProps {
  isOpen: boolean;
  cinematicVideo: IStoryInteractionCinematicVideo | null;
  onClose: () => void;
}

const TERMINAL_FOLD_DURATION_MS = 340;

/**
 * Reproduce vídeo narrativo full-screen sin acoplar el resto del diálogo ni la lógica del mapa.
 */
export function StoryInteractionVideoOverlay({
  isOpen,
  cinematicVideo,
  onClose,
}: IStoryInteractionVideoOverlayProps) {
  const [isClosing, setIsClosing] = useState(false);
  const closeTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
    };
  }, []);

  const foldAndClose = (): void => {
    if (!cinematicVideo) return;
    if (isClosing) return;
    setIsClosing(true);
    closeTimerRef.current = window.setTimeout(onClose, TERMINAL_FOLD_DURATION_MS);
  };

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
          <div className="absolute inset-0 flex items-center justify-center p-3 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-[calc(env(safe-area-inset-top)+12px)] md:p-8">
            <motion.div
              animate={{
                scaleY: isClosing ? 0.04 : 1,
                opacity: isClosing ? 0.7 : 1,
              }}
              transition={{ duration: 0.34, ease: "easeInOut" }}
              initial={{ scaleY: 0.04, opacity: 0.72 }}
              className="relative aspect-video w-[min(94vw,900px)] origin-center overflow-hidden rounded-xl border border-cyan-300/45 bg-zinc-950 md:max-h-[88vh] md:max-w-[1280px] md:rounded-2xl md:shadow-[0_0_60px_rgba(34,211,238,0.3)]"
            >
              <motion.div
                aria-hidden
                animate={{ opacity: isClosing ? 1 : 0, scaleX: isClosing ? 1 : 0.2 }}
                transition={{ duration: 0.24, ease: "easeOut" }}
                initial={{ opacity: 1, scaleX: 1 }}
                className="absolute left-0 right-0 top-1/2 z-20 h-[2px] bg-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.9)]"
              />
              <div className="hidden h-9 items-center justify-between border-b border-cyan-300/20 bg-zinc-900/95 px-4 md:flex">
                <span className="text-[10px] font-black uppercase tracking-[0.16em] text-cyan-100/85">Neural Story Terminal</span>
                <span className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-300/80">{isClosing ? "closing..." : "streaming..."}</span>
              </div>
              <div className="pointer-events-none absolute inset-0 z-10 opacity-[0.17] [background-image:linear-gradient(to_bottom,rgba(34,211,238,0.15)_1px,transparent_1px)] [background-size:100%_3px]" />
              <video
                className="h-full w-full bg-black object-contain md:aspect-video md:h-auto md:max-h-[calc(88vh-2.25rem)]"
                src={cinematicVideo.videoUrl}
                poster={cinematicVideo.posterUrl}
                autoPlay={cinematicVideo.autoPlay ?? true}
                loop={cinematicVideo.loop ?? false}
                playsInline
                controls={false}
                onEnded={foldAndClose}
              />
            </motion.div>
          </div>
          <button
            type="button"
            aria-label={cinematicVideo.skipLabel ?? "Interrumpir vídeo"}
            onClick={foldAndClose}
            className="absolute right-4 top-4 z-20 rounded-full border border-cyan-400/80 bg-black/70 px-4 py-2 text-[11px] font-black uppercase tracking-[0.14em] text-cyan-100 shadow-[0_0_18px_rgba(34,211,238,0.35)] md:right-8 md:top-7"
          >
            {cinematicVideo.skipLabel ?? "Interrumpir vídeo"}
          </button>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
