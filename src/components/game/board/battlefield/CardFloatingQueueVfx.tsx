// src/components/game/board/battlefield/CardFloatingQueueVfx.tsx - Cola unificada de flotantes por carta para evitar solapes de EXP y cambios de stats.
"use client";

import { useEffect, useRef, useState } from "react";
import { BuffImpactVfx } from "./BuffImpactVfx";
import { CardXpGainVfx } from "./CardXpGainVfx";

type CardFloatingEvent =
  | { id: string; type: "XP"; amount: number }
  | { id: string; type: "STAT"; amount: number; stat: "ATTACK" | "DEFENSE" };

interface CardFloatingQueueVfxProps {
  entityId: string;
  events: CardFloatingEvent[];
}

function resolveDurationMs(event: CardFloatingEvent): number {
  return event.type === "XP" ? 1300 : 1400;
}

export function CardFloatingQueueVfx({ entityId, events }: CardFloatingQueueVfxProps) {
  const seenIdsRef = useRef<Set<string>>(new Set());
  const [queue, setQueue] = useState<CardFloatingEvent[]>([]);
  const activeEvent = queue[0] ?? null;

  useEffect(() => {
    if (events.length === 0) return;
    const nextEvents = events.filter((event) => !seenIdsRef.current.has(event.id));
    if (nextEvents.length === 0) return;
    nextEvents.forEach((event) => seenIdsRef.current.add(event.id));
    setQueue((previous) => [...previous, ...nextEvents]);
  }, [events]);

  useEffect(() => {
    if (!activeEvent) return;
    const timeoutId = setTimeout(() => {
      setQueue((previous) => previous.slice(1));
    }, resolveDurationMs(activeEvent));
    return () => clearTimeout(timeoutId);
  }, [activeEvent]);

  if (!activeEvent) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-[95]">
      {activeEvent.type === "XP" ? (
        <CardXpGainVfx eventId={activeEvent.id} entityId={entityId} amount={activeEvent.amount} />
      ) : (
        <BuffImpactVfx eventId={activeEvent.id} entityId={entityId} stat={activeEvent.stat} amount={activeEvent.amount} />
      )}
    </div>
  );
}
