// src/components/game/board/battlefield/ExecutionActivationVfx.tsx - VFX de activación de ejecuciones/trampas con degradación adaptativa en móvil.
import { motion } from "framer-motion";
import { IBoardEntity } from "@/core/entities/IPlayer";
import { DigitalBeam } from "./DigitalBeam";
import { useBoardPerformanceProfile } from "@/components/game/board/internal/use-board-performance-profile";
import { ExecutionChargedActionVfx } from "@/components/game/board/battlefield/internal/ExecutionChargedActionVfx";
import { ChargeCastSfx } from "@/components/game/board/battlefield/internal/ChargeCastSfx";

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
      <div className="pointer-events-none absolute inset-0 z-[210] flex items-center justify-center">
        <div className="rounded border border-white/35 bg-black/70 px-3 py-1">
          <span className={`text-xs font-black tracking-wider ${textClass}`}>{label}</span>
        </div>
      </div>
    );
  }

  if (action === "DAMAGE") {
    return (
      <>
        <ChargeCastSfx enabled />
        <DigitalBeam direction={isOpponentSide ? "towards-player" : "towards-opponent"} onComplete={() => undefined} />
      </>
    );
  }
  if (action === "RESTORE_ENERGY" || action === "DRAIN_OPPONENT_ENERGY" || action === "SET_CARD_DUEL_PROGRESS") {
    return <ExecutionChargedActionVfx action={action} isOpponentSide={isOpponentSide} />;
  }

  if (action === "HEAL") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.55 }}
        animate={{ opacity: [0, 1, 0], scale: [0.55, 1.45, 1.06] }}
        transition={{ duration: 1.28, ease: "easeOut" }}
        className="absolute -inset-10 rounded-full pointer-events-none z-[220] bg-[radial-gradient(circle,rgba(16,185,129,0.82)_0%,rgba(16,185,129,0.24)_42%,rgba(16,185,129,0)_82%)]"
      >
        <ChargeCastSfx enabled path="/audio/sfx/cargar.mp3" volume={0.7} />
        <motion.div
          initial={{ y: 14, opacity: 0 }}
          animate={{ y: -48, opacity: [0, 1, 0] }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 text-5xl font-black text-emerald-100 drop-shadow-[0_0_24px_rgba(52,211,153,1)]"
        >
          HEAL
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.6, x: 0, y: 0 }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0.6, 1, 0.72],
            x: [0, isOpponentSide ? 330 : -330],
            y: [0, isOpponentSide ? -280 : 280],
          }}
          transition={{ duration: 0.95, ease: "easeOut" }}
          className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-300/70 blur-[1px] shadow-[0_0_32px_rgba(16,185,129,0.95)]"
        />
      </motion.div>
    );
  }

  if (isBuffAction(action)) {
    const isAttackBuff = action !== "BOOST_DEFENSE_BY_ARCHETYPE";
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.72, rotate: -8 }}
        animate={{ opacity: [0, 1, 0], scale: [0.72, 1.3, 1.06], rotate: [-8, 8, -8, 0] }}
        transition={{ duration: 1.45, ease: "easeOut" }}
        className={`absolute -inset-8 rounded-3xl pointer-events-none z-[210] ${
          isAttackBuff
            ? "bg-[radial-gradient(circle,rgba(248,113,113,0.58)_0%,rgba(248,113,113,0.16)_42%,rgba(248,113,113,0)_78%)]"
            : "bg-[radial-gradient(circle,rgba(147,197,253,0.58)_0%,rgba(147,197,253,0.16)_42%,rgba(147,197,253,0)_78%)]"
        }`}
      >
        <motion.div
          initial={{ opacity: 0, x: -34 }}
          animate={{ opacity: [0, 1, 0], x: [-34, 18, 54] }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className={`absolute inset-0 mix-blend-screen ${
            isAttackBuff
              ? "bg-[linear-gradient(120deg,transparent_0%,rgba(248,113,113,0.95)_50%,transparent_100%)]"
              : "bg-[linear-gradient(120deg,transparent_0%,rgba(147,197,253,0.95)_50%,transparent_100%)]"
          }`}
        />
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.85 }}
          animate={{ opacity: [0, 1, 0], y: [30, -25, -55], scale: [0.85, 1.15, 0.95] }}
          transition={{ duration: 1.35, ease: "easeOut" }}
          className={isAttackBuff
            ? "absolute inset-x-8 bottom-2 h-20 rounded-full bg-[radial-gradient(circle,rgba(251,146,60,0.72)_0%,rgba(249,115,22,0.34)_42%,rgba(249,115,22,0)_82%)] blur-md"
            : "absolute inset-x-8 bottom-2 h-20 rounded-full bg-[radial-gradient(circle,rgba(125,211,252,0.66)_0%,rgba(59,130,246,0.3)_42%,rgba(59,130,246,0)_82%)] blur-md"
          }
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
      <div className="rounded-lg border border-fuchsia-300/70 bg-fuchsia-500/25 px-3 py-1 shadow-[0_0_26px_rgba(217,70,239,0.55)]">
        <span className="text-xs font-black tracking-[0.2em] text-fuchsia-100">{label}</span>
      </div>
    </motion.div>
  );
}

