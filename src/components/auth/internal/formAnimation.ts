// src/components/auth/internal/formAnimation.ts - Centraliza variantes Framer Motion compartidas para formularios de autenticación.
import { Variants } from "framer-motion";

const SWEEP_DURATION_SECONDS = 0.8;
const SWEEP_EASING = "linear";

export const authFormContainerVariants: Variants = {
  hidden: {
    clipPath: "inset(100% 0% 0% 0%)",
    filter: "blur(5px)",
    opacity: 0,
  },
  visible: {
    clipPath: "inset(0% 0% 0% 0%)",
    filter: "blur(0px)",
    opacity: 1,
    transition: {
      duration: SWEEP_DURATION_SECONDS,
      ease: SWEEP_EASING,
    },
  },
};

export const authFormBeamVariants: Variants = {
  hidden: { top: "100%", opacity: 0 },
  visible: {
    top: "-5%",
    opacity: [0, 1, 1, 0],
    transition: {
      duration: SWEEP_DURATION_SECONDS,
      ease: SWEEP_EASING,
    },
  },
};

export function buildAuthPieceVariants(delayPercent: number): Variants {
  return {
    hidden: {
      opacity: 0,
      scale: 0.8,
      filter: "blur(15px)",
      y: 15,
    },
    visible: {
      opacity: 1,
      scale: 1,
      filter: "blur(0px)",
      y: 0,
      transition: {
        delay: delayPercent * SWEEP_DURATION_SECONDS,
        type: "spring",
        stiffness: 400,
        damping: 25,
        mass: 0.5,
      },
    },
  };
}
