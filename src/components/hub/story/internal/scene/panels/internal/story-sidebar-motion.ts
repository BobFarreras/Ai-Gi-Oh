// src/components/hub/story/internal/scene/panels/internal/story-sidebar-motion.ts - Variantes de animación reutilizables del panel Story.
import { Variants } from "framer-motion";

export const storySidebarContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    x: 20,
    filter: "blur(4px)",
    transition: { duration: 0.2 },
  },
};

export const storySidebarItemVariants: Variants = {
  hidden: { opacity: 0, x: -15, filter: "blur(4px)" },
  visible: {
    opacity: 1,
    x: 0,
    filter: "blur(0px)",
    transition: { type: "spring" as const, stiffness: 400, damping: 25 },
  },
};
