// src/components/hub/story/internal/scene/dialog/StoryNodeInteractionDialog.tsx - Modal narrativo para interacciones de nodos Story no-duelo.
"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import { StoryInteractionVideoOverlay } from "@/components/hub/story/internal/scene/dialog/StoryInteractionVideoOverlay";
import { StoryDialogPortraitPanel } from "@/components/hub/story/internal/scene/dialog/internal/StoryDialogPortraitPanel";
import { StoryDialogSpeechBubble } from "@/components/hub/story/internal/scene/dialog/internal/StoryDialogSpeechBubble";
import {
  IStoryInteractionCinematicVideo,
  IStoryInteractionDialogueLine,
} from "@/services/story/story-node-interaction-dialogue-types";

interface IStoryNodeInteractionDialogProps {
  isOpen: boolean;
  title: string;
  soundtrackUrl: string | null;
  cinematicVideo: IStoryInteractionCinematicVideo | null;
  line: IStoryInteractionDialogueLine | null;
  onNext: () => void;
  onClose: () => void;
}

const DEFAULT_AUTO_ADVANCE_MS = 7000;

export function StoryNodeInteractionDialog({
  isOpen,
  title,
  soundtrackUrl,
  cinematicVideo,
  line,
  onNext,
  onClose,
}: IStoryNodeInteractionDialogProps) {
  const isVideoOpen = Boolean(isOpen && cinematicVideo);
  const presentationMode = line?.presentationMode ?? "DIRECT";
  const isTerminalMode = presentationMode === "TERMINAL";
  const autoAdvanceMs = line?.autoAdvanceMs ?? DEFAULT_AUTO_ADVANCE_MS;
  const activeSpeaker = line?.speaker ?? "Interlocutor";
  const portraitUrl = line?.portraitUrl ?? "";
  const actorId = line?.actorId ?? "system";
  const isPlayerSpeaker = actorId === "player";

  // El jugador se fija abajo-izquierda y el interlocutor arriba-derecha para lectura estable.
  const playerPortraitUrl = isPlayerSpeaker ? portraitUrl : "/assets/story/player/bob.png";
  const opponentPortraitUrl = isPlayerSpeaker
    ? "/assets/story/opponents/opp-ch1-biglog/avatar-BigLog.png"
    : (portraitUrl || "/assets/story/opponents/opp-ch1-biglog/avatar-BigLog.png");

  useEffect(() => {
    if (!isOpen || isVideoOpen) return;
    const timeoutId = window.setTimeout(onNext, autoAdvanceMs);
    return () => window.clearTimeout(timeoutId);
  }, [isOpen, isVideoOpen, autoAdvanceMs, onNext]);

  useEffect(() => {
    if (!isOpen || !soundtrackUrl || typeof Audio === "undefined") return;
    const soundtrack = new Audio(soundtrackUrl);
    soundtrack.loop = true;
    soundtrack.volume = 0.35;
    void soundtrack.play().catch(() => undefined);
    return () => {
      soundtrack.pause();
      soundtrack.currentTime = 0;
    };
  }, [isOpen, soundtrackUrl]);

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-50 bg-black/78 backdrop-blur-[1.5px]"
        >
          <div className="relative flex h-full w-full flex-col">
            <header className="pointer-events-none px-4 pb-2 pt-6 sm:px-8">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-cyan-400">Interacción Story</p>
              <h3 className="mt-1 text-base font-black uppercase tracking-wider text-fuchsia-100 sm:text-xl">{title}</h3>
            </header>
            <div className="relative min-h-0 flex-1 px-4 pb-24 sm:px-8">
              <StoryDialogPortraitPanel
                src={playerPortraitUrl}
                alt="Retrato del jugador"
                side="LEFT"
                terminalMode={isTerminalMode}
              />
              <StoryDialogPortraitPanel
                src={opponentPortraitUrl}
                alt={`Retrato de ${activeSpeaker}`}
                side="RIGHT"
                terminalMode={isTerminalMode}
              />
              <AnimatePresence mode="wait">
                <StoryDialogSpeechBubble
                  key={`${line?.speaker ?? "system"}-${line?.text ?? "empty"}`}
                  line={line}
                  isPlayerSpeaker={isPlayerSpeaker}
                  terminalMode={isTerminalMode}
                />
              </AnimatePresence>
            </div>
            <button type="button" onClick={onClose} className="absolute bottom-5 left-4 z-30 rounded border border-slate-700 bg-black/70 px-3 py-2 text-xs font-black uppercase tracking-wider text-slate-200 sm:left-8">Cerrar</button>
            <motion.button
              type="button"
              aria-label="Siguiente diálogo"
              onClick={onNext}
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
              className="absolute bottom-6 right-4 z-30 rounded-full border-2 border-cyan-300 bg-cyan-950/95 px-6 py-3 text-xs font-black uppercase tracking-[0.18em] text-cyan-50 shadow-[0_0_24px_rgba(34,211,238,0.35)] sm:right-8"
            >
              Siguiente
            </motion.button>
            <StoryInteractionVideoOverlay isOpen={isVideoOpen} cinematicVideo={cinematicVideo} onClose={onClose} />
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
