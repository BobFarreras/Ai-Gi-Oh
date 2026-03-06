// src/components/hub/boot/HubBootTransition.tsx - Overlay de arranque con puertas mecánicas y estado de carga para el hub.
"use client";

import { motion } from "framer-motion";

interface HubBootTransitionProps {
  phase: "loading" | "opening";
}

export function HubBootTransition({ phase }: HubBootTransitionProps) {
  const isOpening = phase === "opening";

  return (
    <div className="pointer-events-auto absolute inset-0 z-[70] overflow-hidden bg-[#01030a]">
      <motion.div
        animate={{ x: isOpening ? "-102%" : "0%" }}
        transition={{ duration: 0.62, ease: [0.22, 1, 0.36, 1] }}
        className="absolute inset-y-0 left-0 w-1/2 border-r border-cyan-500/30 bg-[linear-gradient(135deg,#020813_0%,#041325_45%,#081d33_100%)]"
      />
      <motion.div
        animate={{ x: isOpening ? "102%" : "0%" }}
        transition={{ duration: 0.62, ease: [0.22, 1, 0.36, 1] }}
        className="absolute inset-y-0 right-0 w-1/2 border-l border-cyan-500/30 bg-[linear-gradient(225deg,#020813_0%,#041325_45%,#081d33_100%)]"
      />
      <motion.div
        animate={{ opacity: isOpening ? 0 : 1, y: isOpening ? -8 : 0 }}
        transition={{ duration: 0.24, ease: "easeOut" }}
        className="absolute inset-0 flex flex-col items-center justify-center gap-3"
      >
        <div className="h-10 w-10 animate-spin border-2 border-cyan-300/40 border-t-cyan-300" />
        <p className="font-mono text-xs font-black uppercase tracking-[0.24em] text-cyan-200">Inicializando Sala de Control</p>
      </motion.div>
    </div>
  );
}
