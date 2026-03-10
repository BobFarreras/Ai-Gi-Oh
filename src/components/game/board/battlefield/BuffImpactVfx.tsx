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
  const colorClass = isDebuff ? "text-amber-200" : isAttack ? "text-red-300" : "text-blue-300";
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
        key={`${eventId}-${entityId}-amount`}
        initial={{ opacity: 0, y: 14, scale: 0.84 }}
        animate={{ opacity: [0, 1, 0], y: [14, -26, -46], scale: [0.84, 1.02, 1] }}
        transition={{ duration: 0.95, ease: "easeOut" }}
        className={cn(
          "absolute top-1 left-1/2 -translate-x-1/2 z-[80] font-black text-2xl leading-none drop-shadow-[0_0_12px_rgba(0,0,0,0.9)]",
          colorClass,
        )}
      >
        {isDebuff ? "-" : "+"}
        {absoluteAmount}
      </motion.div>
    </>
  );
}
