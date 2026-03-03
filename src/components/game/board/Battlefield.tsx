"use client";

import { useState } from "react";
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
  opponentDeckCount: number;
  playerTopGraveCard: ICard | null;
  opponentTopGraveCard: ICard | null;
  playerGraveyardCount: number;
  opponentGraveyardCount: number;
  activeAttackerId: string | null;
  selectedCard: ICard | null;
  revealedEntities?: string[];
  highlightedPlayerEntityIds?: string[];
  damagedPlayerId?: string | null;
  damageEventId?: string | null;
  buffedEntityIds?: string[];
  buffStat?: "ATTACK" | "DEFENSE" | null;
  buffAmount?: number | null;
  buffEventId?: string | null;
  playerId: string;
  opponentId: string;
  onGraveyardClick: (side: "player" | "opponent") => void;
  onEntityClick: (entity: IBoardEntity | null, isOpponentSide: boolean, event: React.MouseEvent) => void;
}

export function Battlefield({
  playerActiveEntities,
  playerActiveExecutions,
  opponentActiveEntities,
  opponentActiveExecutions,
  playerDeckCount,
  opponentDeckCount,
  playerTopGraveCard,
  opponentTopGraveCard,
  playerGraveyardCount,
  opponentGraveyardCount,
  activeAttackerId,
  selectedCard,
  revealedEntities = [],
  highlightedPlayerEntityIds = [],
  damagedPlayerId = null,
  damageEventId = null,
  buffedEntityIds = [],
  buffStat = null,
  buffAmount = null,
  buffEventId = null,
  playerId,
  opponentId,
  onGraveyardClick,
  onEntityClick,
}: BattlefieldProps) {
  const [zoom, setZoom] = useState(1);

  const handleWheel = (event: React.WheelEvent) => {
    setZoom((previous) => Math.min(Math.max(previous - event.deltaY * 0.001, 0.6), 1.6));
  };

  return (
    <div className="absolute inset-0 pointer-events-auto" onWheel={handleWheel}>
      <motion.div
        drag
        dragConstraints={{ left: -300, right: 300, top: -200, bottom: 200 }}
        dragElastic={0.05}
        animate={{ scale: zoom }}
        transition={{ type: "spring", stiffness: 400, damping: 40 }}
        className="w-full h-full flex items-center justify-center cursor-grab active:cursor-grabbing perspective-[1200px]"
      >
        <div
          style={{ transformStyle: "preserve-3d" }}
          className={cn(
            "w-[1050px] h-[800px] transform rotate-x-[55deg] relative flex flex-col justify-center items-center gap-6 rounded-[3rem] border-[4px] border-cyan-900/80 bg-zinc-950/90 shadow-[0_0_100px_rgba(6,182,212,0.2)_inset,0_50px_100px_rgba(0,0,0,0.9)] backdrop-blur-xl transition-colors duration-500",
          )}
        >
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(6,182,212,0.1)_1px,transparent_1px),linear-gradient(to_bottom,rgba(6,182,212,0.1)_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none rounded-[3rem]" />

          <BattlefieldZone
            side="opponent"
            activeEntities={opponentActiveEntities}
            activeExecutions={opponentActiveExecutions}
            deckCount={opponentDeckCount}
            topGraveCard={opponentTopGraveCard}
            graveyardCount={opponentGraveyardCount}
            activeAttackerId={activeAttackerId}
            selectedCard={selectedCard}
            revealedEntities={revealedEntities}
            highlightedEntityIds={[]}
            shouldDamageFlash={damagedPlayerId === opponentId}
            damageEventId={damageEventId}
            buffedEntityIds={buffedEntityIds}
            buffStat={buffStat}
            buffAmount={buffAmount}
            buffEventId={buffEventId}
            onGraveyardClick={onGraveyardClick}
            onEntityClick={onEntityClick}
          />

          <div className="w-[85%] h-1.5 bg-gradient-to-r from-transparent via-cyan-500 to-transparent shadow-[0_0_20px_rgba(6,182,212,1)] opacity-70 z-10 rounded-full" />

          <BattlefieldZone
            side="player"
            activeEntities={playerActiveEntities}
            activeExecutions={playerActiveExecutions}
            deckCount={playerDeckCount}
            topGraveCard={playerTopGraveCard}
            graveyardCount={playerGraveyardCount}
            activeAttackerId={activeAttackerId}
            selectedCard={selectedCard}
            revealedEntities={revealedEntities}
            highlightedEntityIds={highlightedPlayerEntityIds}
            shouldDamageFlash={damagedPlayerId === playerId}
            damageEventId={damageEventId}
            buffedEntityIds={buffedEntityIds}
            buffStat={buffStat}
            buffAmount={buffAmount}
            buffEventId={buffEventId}
            onGraveyardClick={onGraveyardClick}
            onEntityClick={onEntityClick}
          />
        </div>
      </motion.div>
    </div>
  );
}
