"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { ICombatLogEvent } from "@/core/entities/ICombatLog";

interface GraveyardTransitionLayerProps {
  events: ICombatLogEvent[];
  playerAId: string;
  playerBId: string;
}

interface IAnimationItem {
  id: string;
  cardId: string;
  ownerPlayerId: string;
  from: "HAND" | "BATTLEFIELD";
}

function readPayload(event: ICombatLogEvent): IAnimationItem | null {
  if (event.eventType !== "CARD_TO_GRAVEYARD" || typeof event.payload !== "object" || event.payload === null) {
    return null;
  }

  const payload = event.payload as Record<string, unknown>;
  const cardId = typeof payload.cardId === "string" ? payload.cardId : null;
  const ownerPlayerId = typeof payload.ownerPlayerId === "string" ? payload.ownerPlayerId : null;
  const from = payload.from === "HAND" ? "HAND" : "BATTLEFIELD";
  if (!cardId || !ownerPlayerId) {
    return null;
  }
  return { id: event.id, cardId, ownerPlayerId, from };
}

export function GraveyardTransitionLayer({ events, playerAId, playerBId }: GraveyardTransitionLayerProps) {
  const processedCountRef = useRef(0);
  const [queue, setQueue] = useState<IAnimationItem[]>([]);
  const active = queue[0] ?? null;

  useEffect(() => {
    const nextItems = events.slice(processedCountRef.current).map(readPayload).filter((item): item is IAnimationItem => Boolean(item));
    processedCountRef.current = events.length;
    if (nextItems.length > 0) {
      setQueue((previous) => [...previous, ...nextItems]);
    }
  }, [events]);

  if (!active) {
    return null;
  }

  const isPlayerOwner = active.ownerPlayerId === playerAId;
  const origin = active.from === "HAND" ? (isPlayerOwner ? { x: 0, y: 320 } : { x: 0, y: -320 }) : isPlayerOwner ? { x: -140, y: 140 } : { x: -140, y: -140 };
  const destination =
    active.ownerPlayerId === playerAId
      ? { x: -460, y: 150 }
      : active.ownerPlayerId === playerBId
        ? { x: -460, y: -150 }
        : { x: -460, y: 0 };

  return (
    <div className="absolute inset-0 pointer-events-none z-[141]">
      <AnimatePresence mode="wait">
        <motion.div
          key={active.id}
          initial={{ opacity: 0, ...origin, scale: 0.85 }}
          animate={{ opacity: [0, 1, 1, 0.9], ...destination, scale: [0.85, 1, 0.95, 0.8] }}
          exit={{ opacity: 0, scale: 0.65 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          onAnimationComplete={() => setQueue((previous) => previous.slice(1))}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-3 py-2 rounded-lg border border-zinc-200/50 bg-zinc-900/80 text-zinc-100 text-[11px] font-black tracking-wider uppercase shadow-[0_0_25px_rgba(255,255,255,0.2)]"
        >
          {active.cardId}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
