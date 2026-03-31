// src/components/game/board/battlefield/TrapActivationVfx.tsx - VFX contextual para activación de trampas según su acción de efecto.
"use client";

import { motion } from "framer-motion";
import { IBoardEntity } from "@/core/entities/IPlayer";
import { DigitalBeam } from "./DigitalBeam";
import { useBoardPerformanceProfile } from "@/components/game/board/internal/use-board-performance-profile";
import { ChargeCastSfx } from "@/components/game/board/battlefield/internal/ChargeCastSfx";

interface ITrapActivationVfxProps {
  entity: IBoardEntity;
  isOpponentSide: boolean;
  isTrapActivating: boolean;
}

function resolveTrapLabel(action: string): string {
  if (action === "NEGATE_ATTACK_AND_DESTROY_ATTACKER" || action === "NEGATE_OPPONENT_TRAP_AND_DESTROY") return "NEGATE";
  if (action === "FORCE_SUMMONED_DEFENSE_TO_ATTACK_LOCKED") return "LOCK";
  if (action === "DIRECT_ATTACK_ENERGY_DRAIN_AND_SET_SELF_TO_TEN") return "DRAIN";
  if (action === "COPY_OPPONENT_BUFF_TO_ALLIED_ENTITIES") return "MIRROR";
  if (action === "REDUCE_OPPONENT_DEFENSE") return "DEF-";
  if (action === "REDUCE_OPPONENT_ATTACK") return "ATK-";
  if (action === "DAMAGE") return "DMG";
  return "TRAP";
}

export function TrapActivationVfx({ entity, isOpponentSide, isTrapActivating }: ITrapActivationVfxProps) {
  const { shouldReduceCombatEffects } = useBoardPerformanceProfile();
  const action = entity.card.effect?.action;
  if (!isTrapActivating || entity.card.type !== "TRAP" || !action) return null;
  const isBlockAction = action === "NEGATE_ATTACK_AND_DESTROY_ATTACKER" || action === "NEGATE_OPPONENT_TRAP_AND_DESTROY" || action === "FORCE_SUMMONED_DEFENSE_TO_ATTACK_LOCKED";

  if (shouldReduceCombatEffects) {
    return (
      <div className="pointer-events-none absolute inset-0 z-[210] flex items-center justify-center">
        <div className="rounded border border-fuchsia-300/60 bg-black/70 px-3 py-1">
          <span className="text-xs font-black tracking-wider text-fuchsia-200">{resolveTrapLabel(action)}</span>
        </div>
      </div>
    );
  }

  if (action === "DAMAGE") {
    return (
      <>
        <ChargeCastSfx enabled />
        <DigitalBeam direction={isOpponentSide ? "towards-player" : "towards-opponent"} onComplete={() => undefined} />
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: [0, 1, 0], scale: [0.8, 1.24, 1] }}
          transition={{ duration: 0.9, ease: "easeOut" }}
          className="absolute -inset-7 z-[210] rounded-3xl bg-[radial-gradient(circle,rgba(248,113,113,0.55)_0%,rgba(248,113,113,0.15)_46%,rgba(248,113,113,0)_82%)]"
        />
      </>
    );
  }

  const isDebuff = action === "REDUCE_OPPONENT_ATTACK" || action === "REDUCE_OPPONENT_DEFENSE";
  const isNegate = action === "NEGATE_ATTACK_AND_DESTROY_ATTACKER" || action === "NEGATE_OPPONENT_TRAP_AND_DESTROY";
  const gradient = isDebuff
    ? "bg-[radial-gradient(circle,rgba(192,132,252,0.58)_0%,rgba(192,132,252,0.18)_44%,rgba(192,132,252,0)_80%)]"
    : isNegate
      ? "bg-[radial-gradient(circle,rgba(239,68,68,0.58)_0%,rgba(239,68,68,0.17)_45%,rgba(239,68,68,0)_82%)]"
      : "bg-[radial-gradient(circle,rgba(217,70,239,0.58)_0%,rgba(217,70,239,0.16)_45%,rgba(217,70,239,0)_82%)]";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.72 }}
      animate={{ opacity: [0, 1, 0], scale: [0.72, 1.32, 1] }}
      transition={{ duration: 1.05, ease: "easeOut" }}
      className={`pointer-events-none absolute -inset-8 z-[210] rounded-3xl ${gradient}`}
    >
      {isBlockAction ? <ChargeCastSfx enabled path="/audio/sfx/effects/execution/block.mp3" volume={0.78} /> : null}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="rounded-md border border-fuchsia-300/70 bg-fuchsia-950/65 px-3 py-1 text-xs font-black tracking-[0.16em] text-fuchsia-100">
          {resolveTrapLabel(action)}
        </span>
      </div>
    </motion.div>
  );
}
