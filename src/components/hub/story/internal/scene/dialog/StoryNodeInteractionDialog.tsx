// src/components/hub/story/internal/scene/dialog/StoryNodeInteractionDialog.tsx - Modal narrativo para interacciones de nodos Story no-duelo.
"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { IStoryInteractionDialogueLine } from "@/services/story/resolve-story-node-interaction-dialogue";

interface IStoryNodeInteractionDialogProps {
  isOpen: boolean;
  title: string;
  soundtrackUrl: string | null;
  line: IStoryInteractionDialogueLine | null;
  onNext: () => void;
  onClose: () => void;
}

export function StoryNodeInteractionDialog({
  isOpen,
  title,
  soundtrackUrl,
  line,
  onNext,
  onClose,
}: IStoryNodeInteractionDialogProps) {
  const activeSide = line?.side ?? "RIGHT";
  const activePortraitUrl = line?.portraitUrl ?? "";
  const activeSpeaker = line?.speaker ?? "Interlocutor";
  const autoAdvanceMs = line?.autoAdvanceMs ?? 4200;
  const showLeftSpeaker = Boolean(line?.portraitUrl) && activeSide === "LEFT";
  const showRightSpeaker = Boolean(line?.portraitUrl) && activeSide === "RIGHT";

  useEffect(() => {
    if (!isOpen) return;
    const timeoutId = window.setTimeout(onNext, autoAdvanceMs);
    return () => window.clearTimeout(timeoutId);
  }, [isOpen, autoAdvanceMs, onNext]);

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
              {showLeftSpeaker ? (
                <motion.div initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} className="pointer-events-none absolute bottom-0 left-0 h-[72%] w-[52%]">
                  <Image src={activePortraitUrl} alt={`Retrato de ${activeSpeaker}`} fill sizes="(max-width: 768px) 100vw, 52vw" quality={55} className="object-contain object-bottom-left drop-shadow-[0_0_22px_rgba(34,211,238,0.25)]" />
                </motion.div>
              ) : null}
              {showRightSpeaker ? (
                <motion.div initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} className="pointer-events-none absolute bottom-0 right-0 h-[72%] w-[52%]">
                  <Image src={activePortraitUrl} alt={`Retrato de ${activeSpeaker}`} fill sizes="(max-width: 768px) 100vw, 52vw" quality={55} className="object-contain object-bottom-right drop-shadow-[0_0_22px_rgba(34,211,238,0.25)]" />
                </motion.div>
              ) : null}
              <motion.article
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 14 }}
                className={cn(
                  "pointer-events-auto absolute bottom-24 z-20 w-[min(92vw,640px)] rounded-xl border border-cyan-400/45 bg-slate-950/97 p-5 shadow-[0_0_30px_rgba(6,182,212,0.25)]",
                  activeSide === "RIGHT" ? "right-4 sm:right-8" : "left-4 sm:left-8",
                )}
              >
                <p className="text-sm font-black uppercase tracking-[0.14em] text-cyan-200 drop-shadow-[0_0_10px_rgba(34,211,238,0.25)]">
                  {line?.speaker ?? "Sistema"}
                </p>
                <p className="mt-2 text-base font-semibold leading-relaxed text-white sm:text-lg [text-shadow:0_2px_10px_rgba(0,0,0,0.7)]">
                  {line?.text ?? "Sin contenido narrativo."}
                </p>
                {line?.audioUrl ? (
                  <audio key={line.audioUrl} controls preload="none" className="mt-3 w-full" src={line.audioUrl} />
                ) : null}
                <p className="mt-2 text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">Autoavance activo</p>
              </motion.article>
            </div>
            <div className="pointer-events-none absolute inset-x-0 bottom-5 z-30 flex items-center justify-center gap-2 px-4">
              <button
                type="button"
                onClick={onClose}
                className="pointer-events-auto rounded border border-slate-700 bg-black/70 px-3 py-2 text-xs font-black uppercase tracking-wider text-slate-200"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={onNext}
                className="pointer-events-auto rounded-full border border-cyan-400/70 bg-cyan-950/80 px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-cyan-100 shadow-[0_0_20px_rgba(34,211,238,0.3)]"
              >
                Siguiente diálogo
              </button>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
