"use client";

import { ICard } from "@/core/entities/ICard";
import { ICombatLogEvent } from "@/core/entities/ICombatLog";
import { extractEventCardIds, formatCombatLogEvent } from "../internal/combatLogPresentation";

interface CombatLogEventRowProps {
  event: ICombatLogEvent;
  playerAId: string;
  playerAName: string;
  playerBId: string;
  playerBName: string;
  cardLookup: Record<string, ICard>;
}

function actorPalette(actorPlayerId: string, playerAId: string): { tone: string; border: string } {
  if (actorPlayerId === playerAId) {
    return {
      tone: "text-cyan-200 bg-cyan-500/15 border-cyan-400/40",
      border: "border-cyan-500/35",
    };
  }

  return {
    tone: "text-red-200 bg-red-500/15 border-red-400/40",
    border: "border-red-500/35",
  };
}

export function CombatLogEventRow({
  event,
  playerAId,
  playerAName,
  playerBId,
  playerBName,
  cardLookup,
}: CombatLogEventRowProps) {
  const palette = actorPalette(event.actorPlayerId, playerAId);
  const actorName = event.actorPlayerId === playerAId ? playerAName : playerBName;
  const cardIds = extractEventCardIds(event);

  return (
    <div className={`border ${palette.border} rounded-xl bg-black/35 p-2`}>
      <div className="flex items-center justify-between mb-2">
        <span className={`text-[10px] px-2 py-1 uppercase tracking-widest rounded border ${palette.tone}`}>{actorName}</span>
        <span className="text-[10px] text-zinc-400">
          T{event.turn} · {event.phase}
        </span>
      </div>
      <p className="text-[11px] text-zinc-100 leading-relaxed">
        {formatCombatLogEvent(event, { playerAId, playerAName, playerBId, playerBName })}
      </p>
      {cardIds.length > 0 && (
        <div className="mt-2 flex gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-zinc-500/70 [&::-webkit-scrollbar-track]:bg-transparent">
          {cardIds.map((cardId) => {
            const card = cardLookup[cardId];
            return (
              <div key={`${event.id}-${cardId}`} className="min-w-24 rounded-lg border border-zinc-700/80 bg-zinc-900/70 px-2 py-1">
                <p className="text-[10px] text-zinc-100 truncate">{card?.name ?? cardId}</p>
                <p className="text-[9px] text-zinc-400 uppercase">{card?.type ?? "UNKNOWN"}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
