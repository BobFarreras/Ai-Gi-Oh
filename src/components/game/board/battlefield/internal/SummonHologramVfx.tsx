// src/components/game/board/battlefield/internal/SummonHologramVfx.tsx - Efecto breve de invocación holográfica con núcleo y abanico de luz.
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface SummonHologramVfxProps {
  show: boolean;
}

export function SummonHologramVfx({ show }: SummonHologramVfxProps) {
  const [visible, setVisible] = useState(show);

  useEffect(() => {
    if (!show) return;
    setVisible(true);
    const timeoutId = setTimeout(() => setVisible(false), 980);
    return () => clearTimeout(timeoutId);
  }, [show]);

  if (!visible) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-40">
      <motion.div
        initial={{ opacity: 0.9 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="absolute inset-0 rounded-xl bg-black/75"
      />

      <motion.div
        initial={{ opacity: 1, scale: 0.02 }}
        animate={{ opacity: [1, 0.95, 0], scale: [0.02, 0.35, 2.2] }}
        transition={{ duration: 0.72, times: [0, 0.2, 1], ease: "easeOut" }}
        className="absolute w-3 h-3 rounded-full bg-cyan-100 blur-[1px]"
      />

      <motion.div
        initial={{ opacity: 0.95, scaleX: 0.08, scaleY: 0.05, y: 28 }}
        animate={{ opacity: [0.1, 0.95, 0], scaleX: [0.08, 0.65, 1.15], scaleY: [0.05, 1, 1.45], y: [28, -18, -44] }}
        transition={{ duration: 0.76, times: [0, 0.42, 1], ease: "easeOut" }}
        className="absolute bottom-[35%] w-44 h-56 bg-gradient-to-t from-cyan-300/75 via-cyan-200/50 to-transparent [clip-path:polygon(50%_0%,100%_100%,0%_100%)] blur-[2px]"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.2 }}
        animate={{ opacity: [0, 0.95, 0], scale: [0.2, 1.05, 1.85] }}
        transition={{ delay: 0.08, duration: 0.84, times: [0, 0.45, 1], ease: "easeOut" }}
        className="absolute w-56 h-56 rounded-full border border-cyan-200/80"
      />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: [0, 1, 0], y: [12, -6, -16] }}
        transition={{ delay: 0.12, duration: 0.82, times: [0, 0.35, 1], ease: "easeOut" }}
        className="absolute w-40 h-40 rounded-full bg-cyan-300/10 blur-xl"
      />
    </div>
  );
}
