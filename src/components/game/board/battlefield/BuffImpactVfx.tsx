// src/components/game/board/battlefield/BuffImpactVfx.tsx - VFX de aumento/reducción temporal de estadísticas sobre entidades en el campo.
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useBoardPerformanceProfile } from "@/components/game/board/internal/use-board-performance-profile";

interface BuffImpactVfxProps {
  eventId: string;
  entityId: string;
  stat: "ATTACK" | "DEFENSE";
  amount: number;
}

export function BuffImpactVfx({ eventId, entityId, stat, amount }: BuffImpactVfxProps) {
  const isDebuff = amount < 0;
  const absoluteAmount = Math.abs(amount);
  const isAttack = stat === "ATTACK";
  const colorClass = isDebuff ? "text-violet-200" : isAttack ? "text-red-200" : "text-blue-200";
  const { shouldReduceCombatEffects } = useBoardPerformanceProfile();

  if (shouldReduceCombatEffects) {
    return (
      <div className={cn("absolute top-1 left-1/2 z-[80] -translate-x-1/2 text-lg font-black leading-none", colorClass)}>
        {isDebuff ? "-" : "+"}
        {absoluteAmount}
      </div>
    );
  }

  return (
    <>
      <motion.div
        key={`${eventId}-${entityId}-aura`}
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: [0, 0.95, 0], scale: [0.7, 1.42, 1.08] }}
        transition={{ duration: 1.55, ease: "easeOut" }}
        className={cn(
          "absolute inset-0 z-[78] rounded-2xl",
          isDebuff
            ? "bg-[radial-gradient(circle,rgba(192,132,252,0.6)_0%,rgba(139,92,246,0.2)_45%,rgba(139,92,246,0)_82%)]"
            : isAttack
            ? "bg-[radial-gradient(circle,rgba(248,113,113,0.52)_0%,rgba(248,113,113,0.12)_45%,rgba(248,113,113,0)_80%)]"
            : "bg-[radial-gradient(circle,rgba(96,165,250,0.52)_0%,rgba(96,165,250,0.12)_45%,rgba(96,165,250,0)_80%)]",
        )}
      />
      {!isDebuff ? (
        <motion.div
          key={`${eventId}-${entityId}-rays`}
          initial={{ opacity: 0, scaleX: 0.55 }}
          animate={{ opacity: [0, 1, 0], scaleX: [0.55, 1.18, 0.7] }}
          transition={{ duration: 1.1, ease: "easeOut" }}
          className="absolute inset-0 z-[79] bg-[linear-gradient(120deg,transparent_0%,rgba(125,211,252,0.92)_40%,rgba(59,130,246,0.95)_50%,rgba(125,211,252,0.92)_60%,transparent_100%)] mix-blend-screen"
        />
      ) : null}
      {!isDebuff ? (
        <motion.div
          key={`${eventId}-${entityId}-fire`}
          initial={{ opacity: 0, y: 18, scale: 0.72 }}
          animate={{ opacity: [0, 0.95, 0], y: [18, -12, -40], scale: [0.72, 1.14, 0.92] }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="absolute inset-x-5 bottom-2 z-[79] h-20 rounded-full bg-[radial-gradient(circle,rgba(251,146,60,0.78)_0%,rgba(249,115,22,0.36)_42%,rgba(249,115,22,0)_84%)] blur-md"
        />
      ) : null}
      <motion.div
        key={`${eventId}-${entityId}-amount`}
        initial={{ opacity: 0, y: 16, scale: 0.8 }}
        animate={{ opacity: [0, 1, 1, 0], y: [16, -32, -68], scale: [0.8, 1.28, 1.05] }}
        transition={{ duration: 1.55, ease: "easeOut" }}
        className={cn(
          "absolute top-1 left-1/2 -translate-x-1/2 z-[80] font-black text-5xl leading-none drop-shadow-[0_0_22px_rgba(0,0,0,0.96)]",
          colorClass,
        )}
      >
        {isDebuff ? "-" : "+"}
        {absoluteAmount}
      </motion.div>
    </>
  );
}
