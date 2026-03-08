// src/components/game/board/Battlefield.tsx - Escena 3D del campo de batalla con zonas de jugador y oponente.
"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ICard } from "@/core/entities/ICard";
import { IBoardEntity } from "@/core/entities/IPlayer";
import { cn } from "@/lib/utils";
import { BattlefieldZone } from "./battlefield/BattlefieldZone";

interface BattlefieldProps {
  playerActiveEntities: IBoardEntity[];
  playerActiveExecutions: IBoardEntity[];
  opponentActiveEntities: IBoardEntity[];
  opponentActiveExecutions: IBoardEntity[];
  playerDeckCount: number;
  playerFusionDeckCount: number;
  opponentDeckCount: number;
  opponentFusionDeckCount: number;
  playerTopGraveCard: ICard | null;
  opponentTopGraveCard: ICard | null;
  playerGraveyardCount: number;
  opponentGraveyardCount: number;
  playerDestroyedCount: number;
  opponentDestroyedCount: number;
  activeAttackerId: string | null;
  selectedCard: ICard | null;
  selectedBoardEntityInstanceId: string | null;
  revealedEntities?: string[];
  highlightedPlayerEntityIds?: string[];
  selectedFusionMaterialIds?: string[];
  damagedPlayerId?: string | null;
  damageEventId?: string | null;
  buffedEntityIds?: string[];
  buffStat?: "ATTACK" | "DEFENSE" | null;
  buffAmount?: number | null;
  buffEventId?: string | null;
  cardXpCardId?: string | null;
  cardXpAmount?: number | null;
  cardXpEventId?: string | null;
  cardXpActorPlayerId?: string | null;
  playerId: string;
  opponentId: string;
  canActivateSelectedExecution: boolean;
  viewportBoardScale?: number;
  isMobileLayout?: boolean;
  onActivateSelectedExecution: () => void;
  onGraveyardClick: (side: "player" | "opponent") => void;
  onDestroyedClick?: (side: "player" | "opponent") => void;
  onEntityClick: (entity: IBoardEntity | null, isOpponentSide: boolean, event: React.MouseEvent) => void;
}

export function Battlefield({
  playerActiveEntities,
  playerActiveExecutions,
  opponentActiveEntities,
  opponentActiveExecutions,
  playerDeckCount,
  playerFusionDeckCount,
  opponentDeckCount,
  opponentFusionDeckCount,
  playerTopGraveCard,
  opponentTopGraveCard,
  playerGraveyardCount,
  opponentGraveyardCount,
  playerDestroyedCount,
  opponentDestroyedCount,
  activeAttackerId,
  selectedCard,
  selectedBoardEntityInstanceId,
  revealedEntities = [],
  highlightedPlayerEntityIds = [],
  selectedFusionMaterialIds = [],
  damagedPlayerId = null,
  damageEventId = null,
  buffedEntityIds = [],
  buffStat = null,
  buffAmount = null,
  buffEventId = null,
  cardXpCardId = null,
  cardXpAmount = null,
  cardXpEventId = null,
  cardXpActorPlayerId = null,
  playerId,
  opponentId,
  canActivateSelectedExecution,
  viewportBoardScale = 1,
  isMobileLayout = false,
  onActivateSelectedExecution,
  onGraveyardClick,
  onDestroyedClick = () => undefined,
  onEntityClick,
}: BattlefieldProps) {
  const [zoom, setZoom] = useState(1);
  const [mobileFitScale, setMobileFitScale] = useState(1);
  const [mobileBoardOffsetY, setMobileBoardOffsetY] = useState(-72);
  const effectiveBoardScale = isMobileLayout ? viewportBoardScale * 0.88 * mobileFitScale : viewportBoardScale;

  useEffect(() => {
    if (!isMobileLayout) return;
    const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
    const update = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const narrowPenalty = clamp((430 - width) / 140, 0, 1);
      const shortPenalty = clamp((860 - height) / 260, 0, 1);
      const fitScale = clamp(1 - narrowPenalty * 0.14 - shortPenalty * 0.11, 0.74, 1);
      const offsetY = Math.round(-68 - shortPenalty * 22);
      setMobileFitScale(fitScale);
      setMobileBoardOffsetY(offsetY);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [isMobileLayout]);

  const handleWheel = (event: React.WheelEvent) => {
    setZoom((previous) => Math.min(Math.max(previous - event.deltaY * 0.001, 0.6), 1.6));
  };

  return (
    <div className="absolute inset-0 pointer-events-auto" onWheel={handleWheel}>
      <motion.div
        drag
        dragConstraints={{ left: -300, right: 300, top: -200, bottom: 200 }}
        dragElastic={0.05}
        animate={{ scale: zoom * effectiveBoardScale, y: isMobileLayout ? mobileBoardOffsetY : 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 40 }}
        className={cn(
          "w-full h-full flex items-center justify-center cursor-grab active:cursor-grabbing perspective-[1200px]",
          isMobileLayout ? "" : "-translate-y-18 md:-translate-y-20 lg:-translate-y-22",
        )}
      >
        <div
          style={{ transformStyle: "preserve-3d" }}
          className={cn(
            "w-[1050px] h-[800px] transform rotate-x-[55deg] relative flex flex-col justify-center items-center gap-6 rounded-[3rem] border-[4px] border-cyan-500/35 bg-[linear-gradient(160deg,rgba(7,12,25,0.82),rgba(11,18,36,0.86))] shadow-[0_0_90px_rgba(34,211,238,0.16)_inset,0_44px_90px_rgba(1,6,16,0.86)] backdrop-blur-xl transition-colors duration-500",
          )}
        >
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(56,189,248,0.15)_1px,transparent_1px),linear-gradient(to_bottom,rgba(34,211,238,0.12)_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none rounded-[3rem]" />

          <BattlefieldZone
            side="opponent"
            isMobileLayout={isMobileLayout}
            activeEntities={opponentActiveEntities}
            activeExecutions={opponentActiveExecutions}
            deckCount={opponentDeckCount}
            fusionDeckCount={opponentFusionDeckCount}
            topGraveCard={opponentTopGraveCard}
            graveyardCount={opponentGraveyardCount}
            destroyedCount={opponentDestroyedCount}
            activeAttackerId={activeAttackerId}
            selectedCard={selectedCard}
            selectedBoardEntityInstanceId={selectedBoardEntityInstanceId}
            revealedEntities={revealedEntities}
            highlightedEntityIds={[]}
            selectedEntityIds={[]}
            shouldDamageFlash={damagedPlayerId === opponentId}
            damageEventId={damageEventId}
            buffedEntityIds={buffedEntityIds}
            buffStat={buffStat}
            buffAmount={buffAmount}
            buffEventId={buffEventId}
            cardXpCardId={cardXpActorPlayerId === opponentId ? cardXpCardId : null}
            cardXpAmount={cardXpActorPlayerId === opponentId ? cardXpAmount : null}
            cardXpEventId={cardXpActorPlayerId === opponentId ? cardXpEventId : null}
            canActivateSelectedExecution={false}
            onActivateSelectedExecution={onActivateSelectedExecution}
            onGraveyardClick={onGraveyardClick}
            onDestroyedClick={onDestroyedClick}
            onEntityClick={onEntityClick}
          />

          <div className="w-[85%] h-1.5 bg-gradient-to-r from-transparent via-cyan-500 to-transparent shadow-[0_0_20px_rgba(6,182,212,1)] opacity-70 z-10 rounded-full" />

          <BattlefieldZone
            side="player"
            isMobileLayout={isMobileLayout}
            activeEntities={playerActiveEntities}
            activeExecutions={playerActiveExecutions}
            deckCount={playerDeckCount}
            fusionDeckCount={playerFusionDeckCount}
            topGraveCard={playerTopGraveCard}
            graveyardCount={playerGraveyardCount}
            destroyedCount={playerDestroyedCount}
            activeAttackerId={activeAttackerId}
            selectedCard={selectedCard}
            selectedBoardEntityInstanceId={selectedBoardEntityInstanceId}
            revealedEntities={revealedEntities}
            highlightedEntityIds={highlightedPlayerEntityIds}
            selectedEntityIds={selectedFusionMaterialIds}
            shouldDamageFlash={damagedPlayerId === playerId}
            damageEventId={damageEventId}
            buffedEntityIds={buffedEntityIds}
            buffStat={buffStat}
            buffAmount={buffAmount}
            buffEventId={buffEventId}
            cardXpCardId={cardXpActorPlayerId === playerId ? cardXpCardId : null}
            cardXpAmount={cardXpActorPlayerId === playerId ? cardXpAmount : null}
            cardXpEventId={cardXpActorPlayerId === playerId ? cardXpEventId : null}
            canActivateSelectedExecution={canActivateSelectedExecution}
            onActivateSelectedExecution={onActivateSelectedExecution}
            onGraveyardClick={onGraveyardClick}
            onDestroyedClick={onDestroyedClick}
            onEntityClick={onEntityClick}
          />
        </div>
      </motion.div>
    </div>
  );
}
