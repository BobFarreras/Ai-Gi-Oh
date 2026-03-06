import { motion } from "framer-motion";
import { IBoardEntity } from "@/core/entities/IPlayer";
import { DigitalBeam } from "./DigitalBeam";

interface ExecutionActivationVfxProps {
  entity: IBoardEntity;
  isOpponentSide: boolean;
}

function isBuffAction(action: string): boolean {
  return action === "BOOST_ATTACK_ALLIED_ENTITY" || action === "BOOST_ATTACK_BY_ARCHETYPE" || action === "BOOST_DEFENSE_BY_ARCHETYPE";
}

export function ExecutionActivationVfx({ entity, isOpponentSide }: ExecutionActivationVfxProps) {
  if (entity.card.type !== "EXECUTION" || entity.mode !== "ACTIVATE" || !entity.card.effect) {
    return null;
  }

  const action = entity.card.effect.action;
  if (action === "DAMAGE") {
    return <DigitalBeam direction={isOpponentSide ? "towards-player" : "towards-opponent"} onComplete={() => undefined} />;
  }

  if (action === "HEAL") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: [0, 1, 0], scale: [0.6, 1.35, 1.1] }}
        transition={{ duration: 1.1, ease: "easeOut" }}
        className="absolute -inset-6 rounded-full pointer-events-none z-[210] bg-[radial-gradient(circle,rgba(56,189,248,0.6)_0%,rgba(56,189,248,0.18)_45%,rgba(56,189,248,0)_80%)]"
      >
        <motion.div
          initial={{ y: 14, opacity: 0 }}
          animate={{ y: -48, opacity: [0, 1, 0] }}
          transition={{ duration: 1.1, ease: "easeOut" }}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 text-4xl font-black text-cyan-200 drop-shadow-[0_0_18px_rgba(125,211,252,1)]"
        >
          HEAL
        </motion.div>
      </motion.div>
    );
  }

  if (isBuffAction(action)) {
    const isAttackBuff = action !== "BOOST_DEFENSE_BY_ARCHETYPE";
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.72, rotate: -8 }}
        animate={{ opacity: [0, 1, 0], scale: [0.72, 1.3, 1.06], rotate: [-8, 8, -8, 0] }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        className={`absolute -inset-8 rounded-3xl pointer-events-none z-[210] ${
          isAttackBuff
            ? "bg-[radial-gradient(circle,rgba(248,113,113,0.58)_0%,rgba(248,113,113,0.16)_42%,rgba(248,113,113,0)_78%)]"
            : "bg-[radial-gradient(circle,rgba(147,197,253,0.58)_0%,rgba(147,197,253,0.16)_42%,rgba(147,197,253,0)_78%)]"
        }`}
      >
        <motion.div
          initial={{ opacity: 0, x: -34 }}
          animate={{ opacity: [0, 1, 0], x: [-34, 18, 54] }}
          transition={{ duration: 0.9, ease: "easeOut" }}
          className={`absolute inset-0 mix-blend-screen ${
            isAttackBuff
              ? "bg-[linear-gradient(120deg,transparent_0%,rgba(248,113,113,0.95)_50%,transparent_100%)]"
              : "bg-[linear-gradient(120deg,transparent_0%,rgba(147,197,253,0.95)_50%,transparent_100%)]"
          }`}
        />
      </motion.div>
    );
  }

  return null;
}
