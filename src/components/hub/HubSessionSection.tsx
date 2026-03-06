// src/components/hub/HubSessionSection.tsx - Widget HUD de sesión con acción de cierre para el hub.
"use client";

import { motion } from "framer-motion";
import { LogoutButton } from "@/components/auth/LogoutButton";

export function HubSessionSection() {
  return (
    // Animación de entrada deslizándose desde la derecha
    <motion.section 
      initial={{ opacity: 0, x: 30, filter: "blur(10px)" }}
      animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 }}
      className="relative flex items-center justify-center"
    >
      {/* Línea de conexión decorativa (Cable virtual) */}
      <div className="absolute -left-6 top-1/2 h-[1px] w-6 -translate-y-1/2 bg-red-500/50 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
      
      <LogoutButton />
    </motion.section>
  );
}
