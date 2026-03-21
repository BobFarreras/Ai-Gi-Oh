// src/components/game/board/battlefield/BattlefieldZone.tsx - Renderiza una zona (jugador/oponente) y propaga feedback visual hacia los slots.
import { ICard } from "@/core/entities/ICard";
import { IBoardEntity } from "@/core/entities/IPlayer";
import { cn } from "@/lib/utils";
import { MouseEvent } from "react";
import { BattlefieldLanes } from "./internal/BattlefieldLanes";
import { DeckPile, DestroyedPile, FusionDeckPile, GraveyardPile } from "./internal/BattlefieldPiles";
import { useDamageFlash } from "./internal/useDamageFlash";

interface BattlefieldZoneProps {
  side: "opponent" | "player";
  isMobileLayout?: boolean;
  activeEntities: IBoardEntity[];
  activeExecutions: IBoardEntity[];
  deckCount: number;
  fusionDeckCount: number;
  topGraveCard: ICard | null;
  graveyardCount: number;
  destroyedCount: number;
  activeAttackerId: string | null;
  selectedCard: ICard | null;
  selectedBoardEntityInstanceId: string | null;
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
  canActivateSelectedExecution: boolean;
  onActivateSelectedExecution: () => void;
  onGraveyardClick: (side: "player" | "opponent") => void;
  onFusionDeckClick?: (side: "player" | "opponent") => void;
  onDestroyedClick?: (side: "player" | "opponent") => void;
  onEntityClick: (entity: IBoardEntity | null, isOpponentSide: boolean, event: MouseEvent) => void;
}

export function BattlefieldZone({
  side,
  isMobileLayout = false,
  activeEntities,
  activeExecutions,
  deckCount,
  fusionDeckCount,
  topGraveCard,
  graveyardCount,
  destroyedCount,
  activeAttackerId,
  selectedCard,
  selectedBoardEntityInstanceId,
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
  canActivateSelectedExecution,
  onActivateSelectedExecution,
  onGraveyardClick,
  onFusionDeckClick = () => undefined,
  onDestroyedClick = () => undefined,
  onEntityClick,
}: BattlefieldZoneProps) {
  const isOpponentSide = side === "opponent";
  const zonePadding = isOpponentSide ? "mb-4" : "mt-4";
  const isDamageFlashing = useDamageFlash(shouldDamageFlash, damageEventId);
  const sideStackClass = isMobileLayout ? "relative z-30 flex shrink-0 flex-col gap-2 scale-[0.86] pointer-events-auto" : "relative z-30 flex shrink-0 flex-col gap-3 pointer-events-auto";

  return (
    <div
      style={{ transformStyle: "preserve-3d" }}
      className={cn(
        "flex w-full justify-center items-center gap-8 z-10 p-4 rounded-2xl transition-colors duration-300",
        zonePadding,
        isDamageFlashing ? "bg-red-900/35 shadow-[0_0_40px_rgba(239,68,68,0.4)_inset]" : "",
      )}
    >
      <div className={sideStackClass}>
        <DeckPile deckCount={deckCount} />
        <FusionDeckPile fusionDeckCount={fusionDeckCount} isOpponentSide={isOpponentSide} onClick={onFusionDeckClick} />
      </div>
      <BattlefieldLanes
        isOpponentSide={isOpponentSide}
        activeEntities={activeEntities}
        activeExecutions={activeExecutions}
        activeAttackerId={activeAttackerId}
        selectedCard={selectedCard}
        selectedBoardEntityInstanceId={selectedBoardEntityInstanceId}
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
        canActivateSelectedExecution={canActivateSelectedExecution}
        isMobileLayout={isMobileLayout}
        onActivateSelectedExecution={onActivateSelectedExecution}
        onEntityClick={onEntityClick}
      />
      <div className={sideStackClass}>
        <GraveyardPile
          isOpponentSide={isOpponentSide}
          topGraveCard={topGraveCard}
          graveyardCount={graveyardCount}
          onClick={onGraveyardClick}
        />
        <DestroyedPile isOpponentSide={isOpponentSide} destroyedCount={destroyedCount} onClick={onDestroyedClick} />
      </div>
    </div>
  );
}
