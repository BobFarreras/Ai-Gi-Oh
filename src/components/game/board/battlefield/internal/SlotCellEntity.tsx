// src/components/game/board/battlefield/internal/SlotCellEntity.tsx - Render de entidad ocupando un slot con motion, carta y CTA de ejecución.
"use client";

import { motion } from "framer-motion";
import { Lock, LockOpen } from "lucide-react";
import { MouseEvent } from "react";
import { BattleMode, IBoardEntity } from "@/core/entities/IPlayer";
import { cn } from "@/lib/utils";
import { Card } from "@/components/game/card/Card";
import { CardBack } from "@/components/game/card/CardBack";
import { resolveEntityMotionState } from "@/components/game/board/battlefield/internal/entity-motion";
import { resolveEntityVisibility } from "@/components/game/board/battlefield/internal/entity-visibility";
import { SummonHologramVfx } from "@/components/game/board/battlefield/internal/SummonHologramVfx";
import { TrapActivationVfx } from "@/components/game/board/battlefield/TrapActivationVfx";
import { useBoardPerformanceProfile } from "@/components/game/board/internal/use-board-performance-profile";

interface ISlotCellEntityProps {
  entity: IBoardEntity;
  index: number;
  isOpponentSide: boolean;
  isRevealed: boolean;
  isMobileLayout: boolean;
  isSelectedByCard: boolean;
  selectedCardId: string | null;
  selectedBoardEntityInstanceId: string | null;
  isAttacking: boolean;
  isActivating: boolean;
  shouldShowBlockedLock: boolean;
  isHighlighted: boolean;
  isSelectedMaterial: boolean;
  isInteractionLocked?: boolean;
  onEntityClick: (entity: IBoardEntity | null, isOpponentSide: boolean, event: MouseEvent) => void;
}

export function SlotCellEntity({
  entity,
  index,
  isOpponentSide,
  isRevealed,
  isMobileLayout,
  isSelectedByCard,
  selectedCardId,
  selectedBoardEntityInstanceId,
  isAttacking,
  isActivating,
  shouldShowBlockedLock,
  isHighlighted,
  isSelectedMaterial,
  isInteractionLocked = false,
  onEntityClick,
}: ISlotCellEntityProps) {
  const { shouldReduceCombatEffects } = useBoardPerformanceProfile();
  const isBoardEntitySelected = selectedBoardEntityInstanceId === entity.instanceId || isSelectedByCard;
  const isTrapActivating = entity.card.type === "TRAP" && (isAttacking || isActivating);
  const visibility = resolveEntityVisibility(entity, isRevealed);
  const forceTrapReveal = isTrapActivating && entity.card.type === "TRAP";
  const resolvedBoardMode: BattleMode =
    forceTrapReveal
      ? "ACTIVATE"
      : !visibility.isFaceDown && entity.mode === "SET" && entity.card.type === "ENTITY"
        ? "DEFENSE"
        : (entity.mode as BattleMode);
  const motionState = resolveEntityMotionState({ isAttacking, isActivating, isOpponentSide, isHorizontal: visibility.isHorizontal });
  const targetX = -120 - index * 105;
  const lockedTurnsRemaining = entity.lockedTurnsRemaining ?? 0;
  const isLocked = lockedTurnsRemaining > 0;

  return (
    <motion.div
      key={entity.instanceId}
      style={{ transformStyle: "preserve-3d", transform: `rotateY(${motionState.initial.rotateY}deg) rotateZ(${motionState.initial.rotateZ}deg)` }}
      initial={motionState.initial}
      animate={motionState.animate}
      transition={shouldReduceCombatEffects ? { duration: 0.22, ease: "linear" } : { type: "spring", stiffness: 300, damping: 20 }}
      exit={{ opacity: [1, 0], scale: [0.28, 0.1], x: targetX, y: 0, transition: { duration: 0.4 } }}
      className={cn(
        "w-65 h-85 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 origin-center cursor-pointer",
        isAttacking ? "ring-4 ring-red-500 shadow-[0_0_30px_rgba(239,68,68,1)] animate-pulse rounded-xl" : "",
        isBoardEntitySelected ? "ring-4 ring-cyan-300 shadow-[0_0_35px_rgba(34,211,238,0.9)] rounded-xl" : "",
        isHighlighted ? "ring-4 ring-amber-400 shadow-[0_0_35px_rgba(251,191,36,0.8)] animate-pulse rounded-xl" : "",
        isSelectedMaterial ? "ring-4 ring-cyan-300 shadow-[0_0_35px_rgba(34,211,238,0.9)] rounded-xl" : "",
      )}
      data-tutorial-id={!isOpponentSide ? `tutorial-board-player-entity-card-${entity.card.id}` : undefined}
      data-board-card-id={entity.card.id}
      data-board-entity-instance-id={entity.instanceId}
      onClick={(event) => {
        if (isInteractionLocked) return;
        onEntityClick(entity, isOpponentSide, event);
      }}
    >
      {visibility.isFaceDown && !forceTrapReveal ? (
        <div className="absolute w-full h-full flex items-center justify-center">
          <CardBack isHorizontal={visibility.isHorizontal} />
          {isSelectedMaterial ? <span className="absolute top-2 left-2 px-2 py-0.5 text-[10px] font-black rounded-md bg-cyan-300 text-cyan-950 shadow-[0_0_14px_rgba(34,211,238,0.9)]">MATERIAL</span> : null}
        </div>
      ) : (
        <div className="absolute w-full h-full flex items-center justify-center">
          <SummonHologramVfx show={Boolean((entity.isNewlySummoned && (entity.card.type === "ENTITY" || entity.card.type === "FUSION" || entity.card.type === "TRAP")) || forceTrapReveal)} />
          {/* Wrapper dedicado: el filtro grayscale/brightness apaga la carta REAL (holograma, atributos,
              arte) cuando está bloqueada, sin afectar al candado/overlays que van fuera del wrapper. */}
          <div className={cn(isLocked && "grayscale brightness-[0.5]")}>
            <Card
              card={entity.card}
              isSelected={selectedCardId === entity.card.id}
              hologramMode={isMobileLayout || shouldReduceCombatEffects ? "lite" : "full"}
              boardMode={resolvedBoardMode}
              isPerformanceMode={shouldReduceCombatEffects}
              showBackgroundInPerformanceMode
            />
          </div>
          {shouldShowBlockedLock ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.7, y: 8 }}
              animate={{ opacity: [0, 1, 0], scale: [0.7, 1.16, 0.92], y: [8, -6, -18] }}
              transition={{ duration: 0.9, ease: "easeOut" }}
              className="absolute left-1/2 top-1/2 z-[225] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-red-300/85 bg-red-950/70 px-3 py-2 text-sm font-black tracking-[0.2em] text-red-100 shadow-[0_0_20px_rgba(248,113,113,0.95)]"
              aria-hidden
            >
              LOCK
            </motion.div>
          ) : null}
          <TrapActivationVfx entity={entity} isOpponentSide={isOpponentSide} isTrapActivating={isTrapActivating} />
          {isActivating ? (
            shouldReduceCombatEffects ? (
              <div className="absolute inset-0 z-50 rounded-xl border-2 border-white/55 bg-white/20" />
            ) : (
              <motion.div initial={{ opacity: 0, scale: 0 }} animate={{ opacity: [0, 1, 0], scale: [1, 2.5] }} transition={{ duration: 0.5 }} className="absolute inset-0 bg-white rounded-xl mix-blend-overlay z-50" />
            )
          ) : null}
          {isSelectedMaterial ? <span className="absolute top-2 left-2 px-2 py-0.5 text-[10px] font-black rounded-md bg-cyan-300 text-cyan-950 shadow-[0_0_14px_rgba(34,211,238,0.9)]">MATERIAL</span> : null}
          {isLocked ? (
            <>
              {/* Tinte de apagado sobre la carta bloqueada (la carta ya va en gris). */}
              <div className="pointer-events-none absolute inset-0 z-[58] rounded-xl bg-slate-950/45" aria-hidden />
              {/* Animación de bloqueo: candado GRANDE sobre el holograma que se cierra (abierto -> cerrado)
                  y se encoge hasta desaparecer. El estado persistente de "bloqueado" lo da la carta en gris. */}
              {shouldReduceCombatEffects ? (
                <span className="pointer-events-none absolute inset-0 z-[62] flex items-center justify-center" aria-hidden>
                  <Lock className="h-14 w-14 text-amber-300 drop-shadow-[0_0_24px_rgba(251,191,36,0.9)]" strokeWidth={2.5} />
                </span>
              ) : (
                <div className="pointer-events-none absolute inset-0 z-[62] flex items-center justify-center" aria-hidden>
                  <motion.span
                    className="absolute drop-shadow-[0_0_30px_rgba(251,191,36,0.95)]"
                    initial={{ scale: 2.4, opacity: 0, rotate: -16 }}
                    animate={{ scale: [2.4, 2.05, 2.05], opacity: [0, 1, 0], rotate: [-16, 2, 2] }}
                    transition={{ duration: 0.6, times: [0, 0.5, 1], ease: "easeOut" }}
                  >
                    <LockOpen className="h-16 w-16 text-amber-200" strokeWidth={2.5} />
                  </motion.span>
                  <motion.span
                    className="absolute drop-shadow-[0_0_36px_rgba(251,191,36,1)]"
                    initial={{ scale: 2.2, opacity: 0 }}
                    animate={{ scale: [2.2, 1.7, 1.95, 0.1], opacity: [0, 1, 1, 0] }}
                    transition={{ duration: 1.5, times: [0, 0.3, 0.6, 1], delay: 0.42, ease: "easeInOut" }}
                  >
                    <Lock className="h-16 w-16 text-amber-300" strokeWidth={2.5} />
                  </motion.span>
                </div>
              )}
              {/* Turnos restantes: chip compacto y persistente (para consultar cuánto queda). */}
              <span
                className="pointer-events-none absolute right-1.5 top-1.5 z-[63] flex items-center gap-0.5 rounded-md border border-amber-300/70 bg-slate-950/85 px-1.5 py-0.5 text-[11px] font-black text-amber-100 shadow-[0_0_10px_rgba(0,0,0,0.75)]"
                aria-label={`Carta bloqueada: faltan ${lockedTurnsRemaining} ${lockedTurnsRemaining === 1 ? "turno" : "turnos"}`}
              >
                <Lock className="h-3 w-3" strokeWidth={3} />
                {lockedTurnsRemaining}
              </span>
            </>
          ) : null}
        </div>
      )}
    </motion.div>
  );
}
