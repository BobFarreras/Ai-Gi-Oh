// src/components/hub/sections/HubSectionEntryBurst.tsx - Efecto de entrada que explota al montar una sección del Hub ya renderizada.
"use client";

import { motion } from "framer-motion";

export function HubSectionEntryBurst() {
  return (
    <div className="pointer-events-none fixed inset-0 z-[210] overflow-hidden">
      <motion.div
        initial={{ opacity: 0.95, scale: 0.12 }}
        animate={{ opacity: 0, scale: 20 }}
        transition={{ duration: 0.62, ease: [0.22, 1, 0.36, 1] }}
        className="absolute left-1/2 top-1/2 h-44 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-300/45 bg-[radial-gradient(circle,rgba(56,189,248,0.86)_0%,rgba(2,16,30,0.8)_40%,rgba(1,4,10,0.98)_100%)] shadow-[0_0_56px_rgba(34,211,238,0.6)]"
      />
    </div>
  );
}
