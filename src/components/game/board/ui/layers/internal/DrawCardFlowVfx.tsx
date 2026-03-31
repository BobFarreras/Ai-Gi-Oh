// src/components/game/board/ui/layers/internal/DrawCardFlowVfx.tsx - Overlay de robo de carta desde deck hacia mano según eventos del combatLog.
"use client";

import { motion } from "framer-motion";
import { useEffect, useMemo, useRef } from "react";
import { ICombatLogEvent } from "@/core/entities/ICombatLog";
import { CardBack } from "@/components/game/card/CardBack";

interface IDrawCardFlowVfxProps {
  combatLog: ICombatLogEvent[];
  playerId: string;
  onDrawFlowStart?: (signalId: string, isOpponent: boolean) => void;
  onDrawFlowEnd?: (signalId: string, isOpponent: boolean) => void;
}

interface IDrawEventSignal {
  id: string;
  isOpponent: boolean;
}
interface IDrawAnchors { startX: number; startY: number; endX: number; endY: number; }

function resolveLatestDrawEvent(events: ICombatLogEvent[], playerId: string): IDrawEventSignal | null {
  for (let index = events.length - 1; index >= 0; index -= 1) {
    const event = events[index];
    if (event.eventType !== "CARD_PLAYED") continue;
    const payload = typeof event.payload === "object" && event.payload !== null ? (event.payload as Record<string, unknown>) : null;
    const cardType = payload && typeof payload.cardType === "string" ? payload.cardType : "";
    const mode = payload && typeof payload.mode === "string" ? payload.mode : "";
    const action = payload && typeof payload.effectAction === "string" ? payload.effectAction : "";
    if (cardType !== "EXECUTION" || mode !== "ACTIVATE" || action !== "DRAW_CARD") continue;
    return { id: event.id, isOpponent: event.actorPlayerId !== playerId };
  }
  return null;
}

function readOffsetFromViewportCenter(node: HTMLElement): { x: number; y: number } {
  const rect = node.getBoundingClientRect();
  const x = rect.left + rect.width / 2 - window.innerWidth / 2;
  const y = rect.top + rect.height / 2 - window.innerHeight / 2;
  return { x, y };
}

function resolveDrawAnchors(isOpponent: boolean): IDrawAnchors {
  const fallback = isOpponent ? { startX: 340, startY: -250, endX: 70, endY: -360 } : { startX: -340, startY: 210, endX: -70, endY: 350 };
  if (typeof window === "undefined") return fallback;
  const deckNode = document.querySelector<HTMLElement>(`[data-board-deck-side="${isOpponent ? "opponent" : "player"}"]`);
  const handNode = document.querySelector<HTMLElement>(
    isOpponent ? '[data-board-hand-side="opponent"]' : '[data-tutorial-id="tutorial-board-hand"]',
  );
  if (!deckNode || !handNode) return fallback;
  const source = readOffsetFromViewportCenter(deckNode);
  const target = readOffsetFromViewportCenter(handNode);
  return { startX: source.x, startY: source.y, endX: target.x, endY: target.y };
}

export function DrawCardFlowVfx({ combatLog, playerId, onDrawFlowStart, onDrawFlowEnd }: IDrawCardFlowVfxProps) {
  const latestDrawSignal = useMemo(() => resolveLatestDrawEvent(combatLog, playerId), [combatLog, playerId]);
  const handledSignalRef = useRef<string | null>(null);

  useEffect(() => {
    if (!latestDrawSignal || handledSignalRef.current === latestDrawSignal.id) return;
    handledSignalRef.current = latestDrawSignal.id;
    onDrawFlowStart?.(latestDrawSignal.id, latestDrawSignal.isOpponent);
    const timer = window.setTimeout(() => onDrawFlowEnd?.(latestDrawSignal.id, latestDrawSignal.isOpponent), 1480);
    return () => window.clearTimeout(timer);
  }, [latestDrawSignal, onDrawFlowStart, onDrawFlowEnd]);

  if (!latestDrawSignal) return null;

  const { startX, startY, endX, endY } = resolveDrawAnchors(latestDrawSignal.isOpponent);
  const midX = (startX + endX) / 2;
  const midY = (startY + endY) / 2 - 90;
  const startRotate = latestDrawSignal.isOpponent ? -10 : 10;
  const midRotate = latestDrawSignal.isOpponent ? -4 : 4;

  return (
    <div key={latestDrawSignal.id} className="pointer-events-none absolute inset-0 z-[20] overflow-hidden">
      <motion.div
        initial={{ opacity: 0, x: startX, y: startY, scale: 0.9, rotate: startRotate }}
        animate={{
          opacity: [0, 1, 1, 0],
          x: [startX, midX, endX],
          y: [startY, midY, endY],
          scale: [0.9, 0.84, 0.78],
          rotate: [startRotate, midRotate, 0],
        }}
        transition={{ duration: 1.6, times: [0, 0.55, 1], ease: "easeInOut" }}
        className="absolute left-1/2 top-1/2 h-36 w-24 -translate-x-1/2 -translate-y-1/2"
      >
        <div className="origin-top-left scale-[0.35]">
          <CardBack />
        </div>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, x: startX, y: startY, scaleX: 0.4 }}
        animate={{ opacity: [0, 0.85, 0], x: [startX, endX], y: [startY, endY], scaleX: [0.4, 1.3, 0.6] }}
        transition={{ duration: 1.46, ease: "easeInOut" }}
        className="absolute left-1/2 top-1/2 h-2 w-52 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-300/70 blur-sm"
      />
    </div>
  );
}
