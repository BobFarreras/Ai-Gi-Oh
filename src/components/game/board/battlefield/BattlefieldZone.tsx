// src/components/game/board/battlefield/BattlefieldZone.tsx - Renderiza una zona (jugador/oponente) y propaga feedback visual hacia los slots.
import { ICard } from "@/core/entities/ICard";
import { IBoardEntity } from "@/core/entities/IPlayer";
import { cn } from "@/lib/utils";
import { MouseEvent } from "react";
import { BattlefieldLanes } from "./internal/BattlefieldLanes";
import { DeckPile, GraveyardPile } from "./internal/BattlefieldPiles";
import { useDamageFlash } from "./internal/useDamageFlash";

interface BattlefieldZoneProps {
  side: "opponent" | "player";
  activeEntities: IBoardEntity[];
  activeExecutions: IBoardEntity[];
  deckCount: number;
  topGraveCard: ICard | null;
  graveyardCount: number;
  activeAttackerId: string | null;
  selectedCard: ICard | null;
  revealedEntities: string[];
  highlightedEntityIds: string[];
  selectedEntityIds: string[];
  shouldDamageFlash: boolean;
  damageEventId: string | null;
  buffedEntityIds: string[];
  buffStat: "ATTACK" | "DEFENSE" | null;
  buffAmount: number | null;
  buffEventId: string | null;
  cardXpCardId: string | null;
  cardXpAmount: number | null;
  cardXpEventId: string | null;
  onGraveyardClick: (side: "player" | "opponent") => void;
  onEntityClick: (entity: IBoardEntity | null, isOpponentSide: boolean, event: MouseEvent) => void;
}

export function BattlefieldZone({
  side,
  activeEntities,
  activeExecutions,
  deckCount,
  topGraveCard,
  graveyardCount,
  activeAttackerId,
  selectedCard,
  revealedEntities,
  highlightedEntityIds,
  selectedEntityIds,
  shouldDamageFlash,
  damageEventId,
  buffedEntityIds,
  buffStat,
  buffAmount,
  buffEventId,
  cardXpCardId,
  cardXpAmount,
  cardXpEventId,
  onGraveyardClick,
  onEntityClick,
}: BattlefieldZoneProps) {
  const isOpponentSide = side === "opponent";
  const zonePadding = isOpponentSide ? "mb-4" : "mt-4";
  const isDamageFlashing = useDamageFlash(shouldDamageFlash, damageEventId);

  return (
    <div
      style={{ transformStyle: "preserve-3d" }}
      className={cn(
        "flex w-full justify-center items-center gap-8 z-10 p-4 rounded-2xl transition-colors duration-300",
        zonePadding,
        isDamageFlashing ? "bg-red-900/35 shadow-[0_0_40px_rgba(239,68,68,0.4)_inset]" : "",
      )}
    >
      <GraveyardPile
        isOpponentSide={isOpponentSide}
        topGraveCard={topGraveCard}
        graveyardCount={graveyardCount}
        onClick={onGraveyardClick}
      />
      <BattlefieldLanes
        isOpponentSide={isOpponentSide}
        activeEntities={activeEntities}
        activeExecutions={activeExecutions}
        activeAttackerId={activeAttackerId}
        selectedCard={selectedCard}
        revealedEntities={revealedEntities}
        highlightedEntityIds={highlightedEntityIds}
        selectedEntityIds={selectedEntityIds}
        buffedEntityIds={buffedEntityIds}
        buffStat={buffStat}
        buffAmount={buffAmount}
        buffEventId={buffEventId}
        cardXpCardId={cardXpCardId}
        cardXpAmount={cardXpAmount}
        cardXpEventId={cardXpEventId}
        onEntityClick={onEntityClick}
      />
      <DeckPile deckCount={deckCount} />
    </div>
  );
}
