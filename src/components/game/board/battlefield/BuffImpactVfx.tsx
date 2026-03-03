import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface BuffImpactVfxProps {
  eventId: string;
  entityId: string;
  stat: "ATTACK" | "DEFENSE";
  amount: number;
}

export function BuffImpactVfx({ eventId, entityId, stat, amount }: BuffImpactVfxProps) {
  const isAttack = stat === "ATTACK";
  const colorClass = isAttack ? "text-red-300" : "text-blue-300";
  const ringClass = isAttack
    ? "bg-[radial-gradient(circle,rgba(248,113,113,0.52)_0%,rgba(248,113,113,0.05)_48%,rgba(248,113,113,0)_75%)]"
    : "bg-[radial-gradient(circle,rgba(96,165,250,0.52)_0%,rgba(96,165,250,0.05)_48%,rgba(96,165,250,0)_75%)]";
  const streakClass = isAttack
    ? "bg-[linear-gradient(120deg,transparent_0%,rgba(248,113,113,0.95)_50%,transparent_100%)]"
    : "bg-[linear-gradient(120deg,transparent_0%,rgba(147,197,253,0.95)_50%,transparent_100%)]";

  return (
    <>
      <motion.div
        key={`${eventId}-${entityId}-pulse`}
        initial={{ opacity: 0, scale: 0.72, rotate: -6 }}
        animate={{ opacity: [0, 1, 0], scale: [0.72, 1.32, 1.05], rotate: [0, 8, -8, 0] }}
        transition={{ duration: 1.25, ease: "easeOut" }}
        className={cn("absolute -inset-5 rounded-3xl pointer-events-none z-[70]", ringClass)}
      />
      <motion.div
        key={`${eventId}-${entityId}-streak`}
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: [0, 1, 0], x: [-40, 24, 52] }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className={cn("absolute inset-0 pointer-events-none z-[74] mix-blend-screen", streakClass)}
      />
      <motion.div
        key={`${eventId}-${entityId}-amount`}
        initial={{ opacity: 0, y: 24, scale: 0.7 }}
        animate={{ opacity: [0, 1, 0], y: [24, -56, -84], scale: [0.7, 1.24, 1.05] }}
        transition={{ duration: 1.3, ease: "easeOut" }}
        className={cn(
          "absolute top-2 left-1/2 -translate-x-1/2 z-[80] px-4 py-1.5 rounded-full font-black text-5xl leading-none shadow-[0_0_24px_rgba(0,0,0,0.8)]",
          colorClass,
          isAttack ? "bg-red-950/80 border border-red-400/50" : "bg-blue-950/80 border border-blue-400/50",
        )}
      >
        +{amount}
      </motion.div>
    </>
  );
}
