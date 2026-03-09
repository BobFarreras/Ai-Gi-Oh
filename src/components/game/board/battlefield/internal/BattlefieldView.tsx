// src/components/game/board/battlefield/internal/BattlefieldView.tsx - Render de la escena 3D del campo de batalla con dos zonas y capa visual neon.
"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { BattlefieldZone } from "@/components/game/board/battlefield/BattlefieldZone";
import { BattlefieldViewProps } from "@/components/game/board/battlefield/internal/battlefield-types";

export function BattlefieldView(props: BattlefieldViewProps) {
  return (
    <div className="absolute inset-0 pointer-events-auto" onWheel={props.onWheel}>
      <motion.div
        drag={!props.isMobileLayout}
        dragConstraints={{ left: -300, right: 300, top: -200, bottom: 200 }}
        dragElastic={props.isMobileLayout ? 0 : 0.05}
        animate={{ scale: props.zoom * props.effectiveBoardScale, y: props.isMobileLayout ? props.mobileBoardOffsetY : 0 }}
        transition={props.isMobileLayout ? { type: "tween", duration: 0.16 } : { type: "spring", stiffness: 400, damping: 40 }}
        className={cn(
          "w-full h-full flex items-center justify-center perspective-[1200px]",
          props.isMobileLayout ? "cursor-default touch-pan-y" : "cursor-grab active:cursor-grabbing -translate-y-18 md:-translate-y-20 lg:-translate-y-22",
        )}
      >
        <div
          style={{ transformStyle: "preserve-3d" }}
          className={cn(
            "w-[1050px] h-[800px] transform relative flex flex-col justify-center items-center gap-6 rounded-[3rem] border-[4px] border-cyan-500/35 bg-[linear-gradient(160deg,rgba(7,12,25,0.82),rgba(11,18,36,0.86))] shadow-[0_0_90px_rgba(34,211,238,0.16)_inset,0_44px_90px_rgba(1,6,16,0.86)] backdrop-blur-xl transition-colors duration-500",
            props.isMobileLayout ? "rotate-x-[46deg]" : "rotate-x-[55deg]",
          )}
        >
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(56,189,248,0.15)_1px,transparent_1px),linear-gradient(to_bottom,rgba(34,211,238,0.12)_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none rounded-[3rem]" />
          <BattlefieldZone
            side="opponent"
            isMobileLayout={props.isMobileLayout}
            activeEntities={props.opponentActiveEntities}
            activeExecutions={props.opponentActiveExecutions}
            deckCount={props.opponentDeckCount}
            fusionDeckCount={props.opponentFusionDeckCount}
            topGraveCard={props.opponentTopGraveCard}
            graveyardCount={props.opponentGraveyardCount}
            destroyedCount={props.opponentDestroyedCount}
            activeAttackerId={props.activeAttackerId}
            selectedCard={props.selectedCard}
            selectedBoardEntityInstanceId={props.selectedBoardEntityInstanceId}
            revealedEntities={props.revealedEntities ?? []}
            highlightedEntityIds={[]}
            selectedEntityIds={[]}
            shouldDamageFlash={props.damagedPlayerId === props.opponentId}
            damageEventId={props.damageEventId ?? null}
            buffedEntityIds={props.buffedEntityIds ?? []}
            buffStat={props.buffStat ?? null}
            buffAmount={props.buffAmount ?? null}
            buffEventId={props.buffEventId ?? null}
            cardXpCardId={props.cardXpActorPlayerId === props.opponentId ? (props.cardXpCardId ?? null) : null}
            cardXpAmount={props.cardXpActorPlayerId === props.opponentId ? (props.cardXpAmount ?? null) : null}
            cardXpEventId={props.cardXpActorPlayerId === props.opponentId ? (props.cardXpEventId ?? null) : null}
            canActivateSelectedExecution={false}
            onActivateSelectedExecution={props.onActivateSelectedExecution}
            onGraveyardClick={props.onGraveyardClick}
            onDestroyedClick={props.onDestroyedClick}
            onEntityClick={props.onEntityClick}
          />
          <div className="w-[85%] h-1.5 bg-gradient-to-r from-transparent via-cyan-500 to-transparent shadow-[0_0_20px_rgba(6,182,212,1)] opacity-70 z-10 rounded-full" />
          <BattlefieldZone
            side="player"
            isMobileLayout={props.isMobileLayout}
            activeEntities={props.playerActiveEntities}
            activeExecutions={props.playerActiveExecutions}
            deckCount={props.playerDeckCount}
            fusionDeckCount={props.playerFusionDeckCount}
            topGraveCard={props.playerTopGraveCard}
            graveyardCount={props.playerGraveyardCount}
            destroyedCount={props.playerDestroyedCount}
            activeAttackerId={props.activeAttackerId}
            selectedCard={props.selectedCard}
            selectedBoardEntityInstanceId={props.selectedBoardEntityInstanceId}
            revealedEntities={props.revealedEntities ?? []}
            highlightedEntityIds={props.highlightedPlayerEntityIds ?? []}
            selectedEntityIds={props.selectedFusionMaterialIds ?? []}
            shouldDamageFlash={props.damagedPlayerId === props.playerId}
            damageEventId={props.damageEventId ?? null}
            buffedEntityIds={props.buffedEntityIds ?? []}
            buffStat={props.buffStat ?? null}
            buffAmount={props.buffAmount ?? null}
            buffEventId={props.buffEventId ?? null}
            cardXpCardId={props.cardXpActorPlayerId === props.playerId ? (props.cardXpCardId ?? null) : null}
            cardXpAmount={props.cardXpActorPlayerId === props.playerId ? (props.cardXpAmount ?? null) : null}
            cardXpEventId={props.cardXpActorPlayerId === props.playerId ? (props.cardXpEventId ?? null) : null}
            canActivateSelectedExecution={props.canActivateSelectedExecution}
            onActivateSelectedExecution={props.onActivateSelectedExecution}
            onGraveyardClick={props.onGraveyardClick}
            onDestroyedClick={props.onDestroyedClick}
            onEntityClick={props.onEntityClick}
          />
        </div>
      </motion.div>
    </div>
  );
}
