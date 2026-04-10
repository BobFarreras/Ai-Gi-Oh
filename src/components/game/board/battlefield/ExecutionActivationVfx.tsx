// src/components/game/board/battlefield/ExecutionActivationVfx.tsx - VFX de activación de ejecuciones/trampas con degradación adaptativa en móvil.
import { motion } from "framer-motion";
import { IBoardEntity } from "@/core/entities/IPlayer";
import { DigitalBeam } from "./DigitalBeam";
import { useBoardPerformanceProfile } from "@/components/game/board/internal/use-board-performance-profile";
import { ExecutionChargedActionVfx } from "@/components/game/board/battlefield/internal/ExecutionChargedActionVfx";
import { ChargeCastVfx } from "@/components/game/board/battlefield/internal/ChargeCastVfx";
import { ExecutionHealVfx } from "@/components/game/board/battlefield/internal/ExecutionHealVfx";

interface ExecutionActivationVfxProps {
  entity: IBoardEntity;
  isOpponentSide: boolean;
}

function isBuffAction(action: string): boolean {
  return action === "BOOST_ATTACK_ALLIED_ENTITY" || action === "BOOST_ATTACK_BY_ARCHETYPE" || action === "BOOST_DEFENSE_BY_ARCHETYPE";
}

function resolveActionLabel(action: string): string {
  if (action === "FUSION_SUMMON") return "FUSION";
  if (action === "DRAW_CARD") return "DRAW";
  if (action.includes("GRAVEYARD")) return "GRAVE";
  if (action.includes("ENERGY")) return "ENERGY";
  if (action.includes("SET_") || action.includes("REVEAL")) return "TACTIC";
  return "EFFECT";
}

export function ExecutionActivationVfx({ entity, isOpponentSide }: ExecutionActivationVfxProps) {
  const { shouldReduceCombatEffects } = useBoardPerformanceProfile();

  if (entity.card.type !== "EXECUTION" || entity.mode !== "ACTIVATE" || !entity.card.effect) {
    return null;
  }

  const action = entity.card.effect.action;
  if (shouldReduceCombatEffects) {
    const label = action === "HEAL" ? "HEAL" : action === "DAMAGE" ? "DMG" : "EFFECT";
    const textClass = action === "HEAL" ? "text-cyan-200" : action === "DAMAGE" ? "text-red-200" : "text-amber-200";
    return (
      <div className="pointer-events-none absolute inset-0 z-[260] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.78 }}
          animate={{ opacity: [0, 0.9, 0], scale: [0.78, 1.16, 0.98] }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="absolute inset-4 rounded-2xl bg-[radial-gradient(circle,rgba(250,204,21,0.42)_0%,rgba(250,204,21,0.08)_48%,rgba(250,204,21,0)_84%)]"
        />
        <div className="rounded border border-white/35 bg-black/70 px-3 py-1">
          <span className={`text-xs font-black tracking-wider ${textClass}`}>{label}</span>
        </div>
      </div>
    );
  }

  if (action === "DAMAGE") {
    return (
      <>
        <ChargeCastVfx tone="red" />
        <DigitalBeam direction={isOpponentSide ? "towards-player" : "towards-opponent"} onComplete={() => undefined} />
      </>
    );
  }
  if (action === "RESTORE_ENERGY" || action === "DRAIN_OPPONENT_ENERGY" || action === "SET_CARD_DUEL_PROGRESS") {
    return <ExecutionChargedActionVfx action={action} isOpponentSide={isOpponentSide} />;
  }

  if (action === "HEAL") {
    return <ExecutionHealVfx isOpponentSide={isOpponentSide} />;
  }

  if (isBuffAction(action)) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.72, rotate: -8 }}
        animate={{ opacity: [0, 1, 0], scale: [0.72, 1.3, 1.06], rotate: [-8, 8, -8, 0] }}
        transition={{ duration: 1.45, ease: "easeOut" }}
        className="absolute -inset-8 rounded-3xl pointer-events-none z-[210] bg-[radial-gradient(circle,rgba(250,204,21,0.62)_0%,rgba(250,204,21,0.2)_42%,rgba(250,204,21,0)_78%)]"
      >
        <motion.div
          initial={{ opacity: 0, x: -34 }}
          animate={{ opacity: [0, 1, 0], x: [-34, 18, 54] }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="absolute inset-0 mix-blend-screen bg-[linear-gradient(120deg,transparent_0%,rgba(253,224,71,0.96)_50%,transparent_100%)]"
        />
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.85 }}
          animate={{ opacity: [0, 1, 0], y: [30, -25, -55], scale: [0.85, 1.15, 0.95] }}
          transition={{ duration: 1.35, ease: "easeOut" }}
          className="absolute inset-x-8 bottom-2 h-20 rounded-full bg-[radial-gradient(circle,rgba(251,191,36,0.76)_0%,rgba(245,158,11,0.34)_42%,rgba(245,158,11,0)_82%)] blur-md"
        />
      </motion.div>
    );
  }

  const label = resolveActionLabel(action);
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.75 }}
      animate={{ opacity: [0, 1, 0], scale: [0.75, 1.12, 1] }}
      transition={{ duration: 1.05, ease: "easeOut" }}
      className="pointer-events-none absolute inset-0 z-[210] flex items-center justify-center"
    >
      <ChargeCastVfx tone="fuchsia" zIndexClass="z-[212]" />
      <div className="rounded-lg border border-fuchsia-300/70 bg-fuchsia-500/25 px-3 py-1 shadow-[0_0_26px_rgba(217,70,239,0.55)]">
        <span className="text-xs font-black tracking-[0.2em] text-fuchsia-100">{label}</span>
      </div>
    </motion.div>
  );
}

