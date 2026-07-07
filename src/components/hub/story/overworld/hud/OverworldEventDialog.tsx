// src/components/hub/story/overworld/hud/OverworldEventDialog.tsx - Overlay de evento: reproduce cinemática y muestra líneas de diálogo con retratos.
"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { IStoryNodeInteractionDialogue } from "@/services/story/story-node-interaction-dialogue-types";

interface IOverworldEventDialogProps {
  dialogue: IStoryNodeInteractionDialogue;
  onClose: () => void;
}

/**
 * Reproduce (si hay) la cinemática del nodo y luego avanza sus líneas de diálogo.
 * Reutiliza el mismo contenido narrativo que el Story clásico.
 */
export function OverworldEventDialog({ dialogue, onClose }: IOverworldEventDialogProps) {
  const [isVideoDone, setIsVideoDone] = useState(!dialogue.cinematicVideo);
  const [lineIndex, setLineIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  const line = dialogue.lines[lineIndex] ?? null;
  const isLastLine = lineIndex >= dialogue.lines.length - 1;

  const advance = (): void => {
    if (isLastLine) onClose();
    else setLineIndex((value) => value + 1);
  };

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/80 p-4">
      {!isVideoDone && dialogue.cinematicVideo ? (
        <div className="relative w-full max-w-2xl">
          <video
            ref={videoRef}
            src={dialogue.cinematicVideo.videoUrl}
            poster={dialogue.cinematicVideo.posterUrl}
            autoPlay={dialogue.cinematicVideo.autoPlay ?? true}
            loop={dialogue.cinematicVideo.loop ?? false}
            playsInline
            className="w-full rounded-xl border border-cyan-300/30 shadow-2xl"
            onEnded={() => setIsVideoDone(true)}
          />
          <button
            type="button"
            onClick={() => setIsVideoDone(true)}
            className="absolute right-3 top-3 rounded-md border border-white/25 bg-black/70 px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest text-white transition hover:bg-black/90"
          >
            {dialogue.cinematicVideo.skipLabel ?? "Saltar"}
          </button>
        </div>
      ) : line ? (
        <div className="w-full max-w-lg rounded-2xl border border-cyan-300/30 bg-slate-950/95 p-5 text-cyan-50 shadow-2xl">
          <p className="text-[11px] font-black uppercase tracking-widest text-cyan-300">{dialogue.title}</p>
          <div className={`mt-4 flex items-start gap-3 ${line.side === "LEFT" ? "" : "flex-row-reverse text-right"}`}>
            {line.portraitUrl ? (
              <Image
                src={line.portraitUrl}
                alt=""
                width={64}
                height={64}
                className="h-16 w-16 shrink-0 rounded-full border border-cyan-300/40 object-cover"
              />
            ) : null}
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-cyan-200">{line.speaker}</p>
              <p className="mt-1 text-sm leading-relaxed text-slate-100">{line.text}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={advance}
            className="mt-5 w-full rounded-lg border border-cyan-300/40 bg-cyan-500/15 py-2 text-xs font-bold uppercase tracking-widest text-cyan-100 transition hover:bg-cyan-400/25"
          >
            {isLastLine ? "Cerrar" : "Siguiente"}
          </button>
          <p className="mt-2 text-center text-[10px] text-slate-500">
            {lineIndex + 1} / {dialogue.lines.length}
          </p>
        </div>
      ) : null}
    </div>
  );
}
