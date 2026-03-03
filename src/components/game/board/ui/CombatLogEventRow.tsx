"use client";

import { Sword } from "lucide-react";
import { ICard } from "@/core/entities/ICard";
import { ICombatLogEvent } from "@/core/entities/ICombatLog";
import { Card } from "@/components/game/card/Card";
import { extractEventCardIds, formatCombatLogEvent, formatEventDelta } from "../internal/combatLogPresentation";

interface CombatLogEventRowProps {
  event: ICombatLogEvent;
  playerAId: string;
  playerAName: string;
  playerBId: string;
  playerBName: string;
  cardLookup: Record<string, ICard>;
  onCardClick?: (card: ICard) => void;
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

function readPayloadString(payload: unknown, key: string): string | null {
  if (typeof payload !== "object" || payload === null || !(key in payload)) {
    return null;
  }
  const value = (payload as Record<string, unknown>)[key];
  return typeof value === "string" ? value : null;
}

function readPayloadBoolean(payload: unknown, key: string): boolean | null {
  if (typeof payload !== "object" || payload === null || !(key in payload)) {
    return null;
  }
  const value = (payload as Record<string, unknown>)[key];
  return typeof value === "boolean" ? value : null;
}

export function CombatLogEventRow({
  event,
  playerAId,
  playerAName,
  playerBId,
  playerBName,
  cardLookup,
  onCardClick,
}: CombatLogEventRowProps) {
  const palette = actorPalette(event.actorPlayerId, playerAId);
  const actorName = event.actorPlayerId === playerAId ? playerAName : playerBName;
  const cardIds = extractEventCardIds(event);
  const delta = formatEventDelta(event);
  const deltaToneClass =
    delta?.tone === "red"
      ? "text-red-200 bg-red-900/60 border-red-500/60"
      : delta?.tone === "blue"
        ? "text-blue-200 bg-blue-900/60 border-blue-500/60"
        : "text-amber-200 bg-amber-900/60 border-amber-500/60";
  const attackerCardId = readPayloadString(event.payload, "attackerCardId");
  const defenderCardId = readPayloadString(event.payload, "defenderCardId");
  const attackerDestroyed = readPayloadBoolean(event.payload, "attackerDestroyed");
  const defenderDestroyed = readPayloadBoolean(event.payload, "defenderDestroyed");
  const attackerCard = attackerCardId ? cardLookup[attackerCardId] : undefined;
  const defenderCard = defenderCardId ? cardLookup[defenderCardId] : undefined;
  const isBattleVersusRow = event.eventType === "BATTLE_RESOLVED" && Boolean(attackerCard && defenderCard);
  const isDirectAttackRow = event.eventType === "BATTLE_RESOLVED" && Boolean(attackerCard) && !defenderCardId;
  const winnerText =
    isBattleVersusRow && attackerDestroyed !== null && defenderDestroyed !== null
      ? attackerDestroyed && defenderDestroyed
        ? "Empate"
        : !attackerDestroyed && defenderDestroyed
          ? `Gana ${attackerCard?.name ?? "Atacante"}`
          : attackerDestroyed && !defenderDestroyed
            ? `Gana ${defenderCard?.name ?? "Defensor"}`
            : "Sin destrucciones"
      : null;

  return (
    <div className={`border ${palette.border} rounded-xl bg-black/45 p-2`}>
      <div className="flex items-center justify-between mb-2">
        <span className={`text-[10px] px-2 py-1 uppercase tracking-widest rounded border ${palette.tone}`}>{actorName}</span>
        <div className="flex items-center gap-2">
          {delta && <span className={`text-[10px] px-2 py-1 rounded border font-bold ${deltaToneClass}`}>{delta.text}</span>}
          <span className="text-[10px] text-zinc-400">
            T{event.turn} · {event.phase}
          </span>
        </div>
      </div>
      <p className="text-[11px] text-zinc-100 leading-relaxed">
        {formatCombatLogEvent(event, { playerAId, playerAName, playerBId, playerBName })}
      </p>
      {isBattleVersusRow && attackerCard && defenderCard ? (
        <div className="mt-2">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-zinc-500/70 [&::-webkit-scrollbar-track]:bg-transparent">
            <button aria-label={`Ver carta ${attackerCard.name}`} onClick={() => onCardClick?.(attackerCard)} className="min-w-[76px] hover:opacity-100">
              <div className="scale-[0.2] origin-top-left w-[52px] h-[68px]">
                <Card card={attackerCard} />
              </div>
            </button>
            <div className="flex items-center justify-center w-8 h-8 rounded-full border border-red-500/50 bg-red-950/50">
              <Sword className="w-4 h-4 text-red-300" />
            </div>
            <button aria-label={`Ver carta ${defenderCard.name}`} onClick={() => onCardClick?.(defenderCard)} className="min-w-[76px] hover:opacity-100">
              <div className="scale-[0.2] origin-top-left w-[52px] h-[68px]">
                <Card card={defenderCard} />
              </div>
            </button>
          </div>
          {winnerText && <p className="text-[10px] text-zinc-200 mt-1 font-bold">{winnerText}.</p>}
        </div>
      ) : isDirectAttackRow && attackerCard ? (
        <div className="mt-2">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-zinc-500/70 [&::-webkit-scrollbar-track]:bg-transparent">
            <button aria-label={`Ver carta ${attackerCard.name}`} onClick={() => onCardClick?.(attackerCard)} className="min-w-[76px] hover:opacity-100">
              <div className="scale-[0.2] origin-top-left w-[52px] h-[68px]">
                <Card card={attackerCard} />
              </div>
            </button>
            <div className="flex items-center justify-center w-8 h-8 rounded-full border border-red-500/50 bg-red-950/50">
              <Sword className="w-4 h-4 text-red-300" />
            </div>
            <div className="min-w-[76px] h-[68px] rounded-md border border-red-500/45 bg-red-950/45 flex items-center justify-center">
              <p className="text-[10px] text-red-200 font-black tracking-widest uppercase">Directo</p>
            </div>
          </div>
          <p className="text-[10px] text-zinc-200 mt-1 font-bold">Ataque directo con {attackerCard.name}.</p>
        </div>
      ) : cardIds.length > 0 ? (
        <div className="mt-2 flex gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-zinc-500/70 [&::-webkit-scrollbar-track]:bg-transparent">
          {cardIds.map((cardId) => {
            const card = cardLookup[cardId];
            return (
              <button
                key={`${event.id}-${cardId}`}
                aria-label={`Ver carta ${card?.name ?? cardId}`}
                onClick={() => card && onCardClick?.(card)}
                className="min-w-[76px] hover:opacity-100"
              >
                {card ? (
                  <div className="scale-[0.2] origin-top-left w-[52px] h-[68px]">
                      <Card card={card} />
                  </div>
                ) : (
                  <p className="text-[10px] text-zinc-400">Carta desconocida</p>
                )}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
