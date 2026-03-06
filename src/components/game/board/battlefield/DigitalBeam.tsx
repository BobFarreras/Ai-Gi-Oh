import { motion } from "framer-motion";

interface DigitalBeamProps {
  direction: "towards-player" | "towards-opponent";
  onComplete: () => void;
}

export function DigitalBeam({ direction, onComplete }: DigitalBeamProps) {
  const targetY = direction === "towards-player" ? 1200 : -1200;

  return (
    <motion.div
      initial={{ y: 0, opacity: 0, scaleX: 0 }}
      animate={{ y: [0, targetY], opacity: [0, 1, 1, 0], scaleX: [1, 2, 1, 0.5], scaleY: [0, 1, 4, 1] }}
      transition={{ duration: 0.8, ease: "easeIn" }}
      onAnimationComplete={onComplete}
      className="absolute z-[200] pointer-events-none"
      style={{ rotateX: direction === "towards-player" ? 55 : -55 }}
    >
      <div className="w-4 h-96 bg-white shadow-[0_0_50px_#22d3ee,0_0_100px_#06b6d4] rounded-full" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-full bg-cyan-500/20 blur-xl" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-full bg-cyan-200 animate-pulse" />
    </motion.div>
  );
}
