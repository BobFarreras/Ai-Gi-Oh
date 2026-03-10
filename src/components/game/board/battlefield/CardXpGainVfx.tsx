// src/components/game/board/battlefield/CardXpGainVfx.tsx - Efecto flotante de experiencia ganada sobre una carta del campo.
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useBoardPerformanceProfile } from "@/components/game/board/internal/use-board-performance-profile";

interface CardXpGainVfxProps {
  eventId: string;
  entityId: string;
  amount: number;
}

export function CardXpGainVfx({ eventId, entityId, amount }: CardXpGainVfxProps) {
  const { shouldReduceCombatEffects } = useBoardPerformanceProfile();

  if (shouldReduceCombatEffects) {
    return (
      <div className="pointer-events-none absolute left-1/2 top-2 z-[82] -translate-x-1/2 text-xl font-black leading-none text-emerald-200">
        +{amount} EXP
      </div>
    );
  }

  return (
    <>
      <motion.div
        key={`${eventId}-${entityId}-xp-text`}
        initial={{ opacity: 0, y: 18, scale: 0.72 }}
        animate={{ opacity: [0, 1, 0], y: [18, -32, -62], scale: [0.72, 1.08, 1] }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        className={cn(
          "pointer-events-none absolute left-1/2 top-2 z-[82] -translate-x-1/2 text-3xl font-black leading-none text-emerald-200 drop-shadow-[0_0_10px_rgba(5,150,105,0.75)]",
        )}
      >
        +{amount} EXP
      </motion.div>
    </>
  );
}
