// src/components/hub/story/internal/scene/dialog/internal/StoryDialogSpeechBubble.tsx - Burbuja narrativo-comic anclada al hablante activo con estilo ciberpunk.
"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { IStoryInteractionDialogueLine } from "@/services/story/story-node-interaction-dialogue-types";

interface IStoryDialogSpeechBubbleProps {
  line: IStoryInteractionDialogueLine | null;
  isPlayerSpeaker: boolean;
  terminalMode: boolean;
}

export function StoryDialogSpeechBubble({
  line,
  isPlayerSpeaker,
  terminalMode,
}: IStoryDialogSpeechBubbleProps) {
  const sideClassName = isPlayerSpeaker
    ? "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 md:bottom-[230px] md:left-[188px] md:top-auto md:translate-x-0 md:translate-y-0"
    : "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 md:right-[176px] md:top-[218px] md:left-auto md:translate-x-0 md:translate-y-0";

  return (
    <motion.article
      initial={{
        opacity: 0,
        scale: 0.72,
        x: isPlayerSpeaker ? -42 : 42,
        y: isPlayerSpeaker ? 16 : -16,
      }}
      animate={{
        opacity: 1,
        scale: 1,
        x: 0,
        y: 0,
      }}
      exit={{
        opacity: 0,
        scale: 0.82,
        x: isPlayerSpeaker ? -36 : 36,
        y: isPlayerSpeaker ? 12 : -12,
      }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 26,
      }}
      className={cn(
        "pointer-events-auto absolute z-20 max-h-[34dvh] w-[min(90vw,560px)] overflow-y-auto rounded-2xl border-[3px] border-zinc-950 bg-white p-4 text-zinc-900 shadow-[5px_5px_0_rgba(0,0,0,0.85)] md:max-h-none md:w-[min(86vw,680px)] md:overflow-visible md:p-5",
        sideClassName,
      )}
    >
      {terminalMode ? <div aria-hidden className="pointer-events-none absolute inset-0 rounded-[14px] border border-cyan-300/25" /> : null}
      <span
        aria-hidden
        className={cn(
          "absolute hidden h-4 w-4 rotate-45 border-zinc-950 bg-white md:block",
          isPlayerSpeaker
            ? "left-[-9.5px] top-[70%] border-b-[3px] border-l-[3px]"
            : "right-[-9.5px] top-[26%] border-r-[3px] border-t-[3px]",
        )}
      />
      <p className="text-sm font-black uppercase tracking-[0.14em] text-zinc-900">{line?.speaker ?? "Sistema"}</p>
      <p className="relative mt-2 text-base font-semibold leading-relaxed text-zinc-900 sm:text-lg">{line?.text ?? "Sin contenido narrativo."}</p>
      {line?.audioUrl ? <audio key={line.audioUrl} controls preload="none" className="mt-3 w-full" src={line.audioUrl} /> : null}
      <p className="mt-2 text-[10px] font-black uppercase tracking-[0.18em] text-zinc-700">Autoavance activo</p>
    </motion.article>
  );
}
