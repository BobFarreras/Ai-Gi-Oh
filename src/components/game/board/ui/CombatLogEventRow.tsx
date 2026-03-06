"use client";

import { ICard } from "@/core/entities/ICard";
import { extractEventCardIds, formatCombatLogEvent, formatEventDelta } from "../internal/combatLogPresentation";
import { CombatLogCardsStrip, CombatLogBattleStrip, CombatLogDirectAttackStrip } from "./internal/combat-log-row/CombatLogCardsStrip";
import { CombatLogEventHeader } from "./internal/combat-log-row/CombatLogEventHeader";
import { actorPalette, readPayloadString, resolveWinnerText } from "./internal/combat-log-row/presentation";
import { ICombatLogEventRowProps } from "./internal/combat-log-row/types";

export function CombatLogEventRow({
  event,
  playerAId,
  playerAName,
  playerBId,
  playerBName,
  cardLookup,
  onCardClick,
}: ICombatLogEventRowProps) {
  const palette = actorPalette(event.actorPlayerId, playerAId);
  const actorName = event.actorPlayerId === playerAId ? playerAName : playerBName;
  const cards = extractEventCardIds(event).map((cardId) => cardLookup[cardId]).filter((card): card is ICard => Boolean(card));
  const delta = formatEventDelta(event);
  const deltaToneClass =
    delta?.tone === "red"
      ? "text-red-200 bg-red-900/60 border-red-500/60"
      : delta?.tone === "blue"
        ? "text-blue-200 bg-blue-900/60 border-blue-500/60"
        : "text-amber-200 bg-amber-900/60 border-amber-500/60";
  const attackerCardId = readPayloadString(event.payload, "attackerCardId");
  const defenderCardId = readPayloadString(event.payload, "defenderCardId");
  const attackerCard = attackerCardId ? cardLookup[attackerCardId] : undefined;
  const defenderCard = defenderCardId ? cardLookup[defenderCardId] : undefined;
  const isBattleVersusRow = event.eventType === "BATTLE_RESOLVED" && Boolean(attackerCard && defenderCard);
  const isDirectAttackRow = event.eventType === "BATTLE_RESOLVED" && Boolean(attackerCard) && !defenderCardId;
  const winnerText = isBattleVersusRow && attackerCard && defenderCard ? resolveWinnerText(event, attackerCard.name, defenderCard.name) : null;

  return (
    <div className={`border ${palette.border} rounded-xl bg-black/45 p-2`}>
      <CombatLogEventHeader event={event} actorName={actorName} actorToneClass={palette.tone} deltaText={delta?.text ?? null} deltaToneClass={deltaToneClass} />
      <p className="text-[11px] text-zinc-100 leading-relaxed">
        {formatCombatLogEvent(event, { playerAId, playerAName, playerBId, playerBName })}
      </p>
      {isBattleVersusRow && attackerCard && defenderCard ? (
        <CombatLogBattleStrip attackerCard={attackerCard} defenderCard={defenderCard} winnerText={winnerText} onCardClick={onCardClick} />
      ) : isDirectAttackRow && attackerCard ? (
        <CombatLogDirectAttackStrip attackerCard={attackerCard} onCardClick={onCardClick} />
      ) : cards.length > 0 ? (
        <CombatLogCardsStrip cards={cards} onCardClick={onCardClick} />
      ) : null}
    </div>
  );
}
