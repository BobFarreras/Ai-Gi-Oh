// src/components/tfm/internal/TFMAnimatedReveal.tsx - Contenedor animado para entrada lateral de bloques en la presentación TFM.
"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";

interface ITFMAnimatedRevealProps {
  children: ReactNode;
  delay?: number;
  direction?: "left" | "right" | "up";
  className?: string;
}

/**
 * Aplica animación de ensamblaje lateral al entrar en viewport.
 */
export function TFMAnimatedReveal({
  children,
  delay = 0,
  direction = "up",
  className,
}: ITFMAnimatedRevealProps) {
  const offsetX = direction === "left" ? -80 : direction === "right" ? 80 : 0;
  const offsetY = direction === "up" ? 56 : 0;
  const canObserve = typeof window !== "undefined" && "IntersectionObserver" in window;

  return (
    <motion.section
      initial={canObserve ? { opacity: 0, x: offsetX, y: offsetY, scale: 0.96 } : false}
      whileInView={canObserve ? { opacity: 1, x: 0, y: 0, scale: 1 } : undefined}
      animate={!canObserve ? { opacity: 1, x: 0, y: 0, scale: 1 } : undefined}
      viewport={canObserve ? { once: true, amount: 0.25 } : undefined}
      transition={{ duration: 0.62, ease: "easeOut", delay }}
      className={className}
    >
      {children}
    </motion.section>
  );
}
