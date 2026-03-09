// src/components/game/board/ui/CinematicNarrationOverlay.tsx - Overlay de diálogo especial que entra desde lateral con retrato y texto de evento narrativo.
"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { IResolvedNarrationAction } from "@/components/game/board/narration/types";

interface CinematicNarrationOverlayProps {
  action: IResolvedNarrationAction | null;
  playerId: string;
  playerAvatarUrl?: string | null;
  opponentAvatarUrl?: string | null;
}

export function CinematicNarrationOverlay({ action, playerId, playerAvatarUrl, opponentAvatarUrl }: CinematicNarrationOverlayProps) {
  return (
    <AnimatePresence mode="wait">
      {action ? (() => {
        const isPlayerActor = action.actorPlayerId === playerId;
        const avatarUrl = action.line.portraitUrl ?? (isPlayerActor ? playerAvatarUrl : opponentAvatarUrl);
        const bubbleAnchorClass = isPlayerActor ? "origin-left -translate-y-2" : "origin-right -translate-y-2";
        const bubbleTailClass = isPlayerActor ? "border-r-2 border-b-2 -left-[7px]" : "border-l-2 border-t-2 -right-[7px]";
        return (
          <motion.div
            key={`${action.line.id}-${action.sourceEvent?.id ?? "result"}`}
            initial={{ opacity: 0, x: isPlayerActor ? -96 : 96, y: isPlayerActor ? 12 : -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 96, transition: { duration: 0.58 } }}
            transition={{ type: "spring", stiffness: 200, damping: 22 }}
            className={`pointer-events-none absolute z-[650] ${isPlayerActor ? "bottom-24 left-6" : "top-14 right-6"}`}
          >
            <div className={`flex max-w-[min(88vw,620px)] items-center gap-3 ${isPlayerActor ? "flex-row" : "flex-row-reverse"}`}>
              <motion.div
                initial={{ opacity: 0, x: isPlayerActor ? -34 : 34, scale: 0.94 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 90, scale: 0.9, transition: { duration: 0.4, delay: 0.14 } }}
                transition={{ type: "spring", stiffness: 180, damping: 22 }}
                className="relative h-[170px] w-[170px] shrink-0 overflow-visible bg-transparent"
              >
                {avatarUrl ? (
                  <Image src={avatarUrl} alt="Retrato de duelista" fill sizes="170px" priority className="object-contain drop-shadow-[0_0_24px_rgba(34,211,238,0.45)]" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm font-black uppercase tracking-[0.15em] text-cyan-100">{isPlayerActor ? "YOU" : "CPU"}</div>
                )}
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.82, x: isPlayerActor ? -20 : 20 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.76, x: isPlayerActor ? -14 : 14, transition: { duration: 0.24 } }}
                transition={{ type: "spring", stiffness: 165, damping: 20, delay: 0.32 }}
                className={`relative rounded-xl border-2 border-black bg-white px-4 py-3 text-left text-black shadow-[0_8px_0_rgba(0,0,0,0.9)] ${bubbleAnchorClass}`}
              >
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-black/70">{isPlayerActor ? "Arquitecto" : "Oponente"}</p>
                <p className="text-sm font-black leading-snug">{action.line.text}</p>
                <span className={`absolute top-1/2 h-3 w-3 -translate-y-1/2 rotate-45 border-black bg-white ${bubbleTailClass}`} />
              </motion.div>
            </div>
          </motion.div>
        );
      })() : null}
    </AnimatePresence>
  );
}
