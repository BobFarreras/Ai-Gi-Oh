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
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.8 }}
        animate={{ opacity: [0, 1, 0], y: [24, -26, -72], scale: [0.8, 1.18, 1.05] }}
        transition={{ duration: 1.55, ease: "easeOut" }}
        className={cn("absolute -top-2 left-1/2 z-[240] -translate-x-1/2 text-4xl font-black leading-none", colorClass)}
      >
        {isDebuff ? "-" : "+"}
        {absoluteAmount}
      </motion.div>
    );
  }

  return (
    <>
      <motion.div
        key={`${eventId}-${entityId}-aura`}
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: [0, 0.95, 0], scale: [0.7, 1.42, 1.08] }}
        transition={{ duration: 2.2, ease: "easeOut" }}
        className={cn(
          "absolute inset-0 z-[236] rounded-2xl",
          isDebuff
            ? "bg-[radial-gradient(circle,rgba(192,132,252,0.6)_0%,rgba(139,92,246,0.2)_45%,rgba(139,92,246,0)_82%)]"
            : "bg-[radial-gradient(circle,rgba(250,204,21,0.6)_0%,rgba(250,204,21,0.2)_45%,rgba(250,204,21,0)_82%)]",
        )}
      />
      {!isDebuff ? (
        <motion.div
          key={`${eventId}-${entityId}-rays`}
          initial={{ opacity: 0, scaleX: 0.45, scaleY: 0.8 }}
          animate={{ opacity: [0, 1, 0.7, 0], scaleX: [0.45, 1.26, 0.92, 0.7], scaleY: [0.8, 1, 1.06, 0.94] }}
          transition={{ duration: 1.75, ease: "easeOut" }}
          className="absolute inset-0 z-[237] bg-[linear-gradient(120deg,transparent_0%,rgba(253,224,71,0.96)_38%,rgba(250,204,21,0.98)_50%,rgba(253,224,71,0.96)_62%,transparent_100%)] mix-blend-screen"
        />
      ) : null}
      {!isDebuff ? (
        <motion.div
          key={`${eventId}-${entityId}-fire`}
          initial={{ opacity: 0, y: 24, scale: 0.66 }}
          animate={{ opacity: [0, 0.96, 0.75, 0], y: [24, -8, -28, -58], scale: [0.66, 1.12, 1.02, 0.9] }}
          transition={{ duration: 1.95, ease: "easeOut" }}
          className="absolute inset-x-4 bottom-1 z-[238] h-24 rounded-full bg-[radial-gradient(circle,rgba(251,146,60,0.85)_0%,rgba(249,115,22,0.4)_42%,rgba(249,115,22,0)_84%)] blur-md"
        />
      ) : null}
      <motion.div
        key={`${eventId}-${entityId}-amount`}
        initial={{ opacity: 0, y: 34, scale: 0.7 }}
        animate={{ opacity: [0, 1, 1, 0.55, 0], y: [34, -18, -82, -156, -226], scale: [0.7, 1.48, 1.32, 1.2, 1.12] }}
        transition={{ duration: 2.85, ease: "easeOut" }}
        className={cn(
          "absolute top-4 left-1/2 -translate-x-1/2 z-[239] font-black text-7xl leading-none drop-shadow-[0_0_24px_rgba(0,0,0,0.98)]",
          colorClass,
        )}
      >
        {isDebuff ? "-" : "+"}
        {absoluteAmount}
      </motion.div>
    </>
  );
}
