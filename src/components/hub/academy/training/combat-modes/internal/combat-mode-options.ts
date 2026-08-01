// src/components/hub/academy/training/combat-modes/internal/combat-mode-options.ts - Catálogo estático de entradas del portal.
import {
  ACADEMY_TRAINING_ARENA_CLASSIC_ROUTE,
  ACADEMY_TRAINING_OLYMPUS_ROUTE,
  ACADEMY_TRAINING_SURVIVAL_ROUTE,
} from "@/core/constants/routes/academy-routes";
import { ICombatModeOption } from "./combat-mode.types";

/**
 * Mantiene el contenido del portal separado del render para facilitar futuras flags server-side.
 */
export const COMBAT_MODE_OPTIONS: ICombatModeOption[] = [
  {
    id: "classic",
    eyebrow: "Competición táctica",
    title: "Arena clásica",
    description: "Supera rivales por niveles, domina cada tier y mejora tu estrategia combate a combate.",
    imageUrl: "/assets/combat/modes/arena.webp",
    imageAlt: "Anfiteatro cibernético de la Arena clásica",
    href: ACADEMY_TRAINING_ARENA_CLASSIC_ROUTE,
    availabilityLabel: "Entrar en Arena clásica",
  },
  {
    id: "survival",
    eyebrow: "Resistencia infinita",
    title: "Supervivencia",
    description: "Encadena duelos conservando tus LP y alcanza hitos para recuperar fuerzas.",
    imageUrl: "/assets/combat/modes/survival.webp",
    imageAlt: "Puesto avanzado fortificado del modo Supervivencia",
    href: ACADEMY_TRAINING_SURVIVAL_ROUTE,
    availabilityLabel: "Entrar en Supervivencia",
  },
  {
    id: "olympus",
    eyebrow: "Desafío legendario",
    title: "Olimpo",
    description: "Potencia a tus campeones y desafía a leyendas con mazos exclusivos y recompensas únicas.",
    imageUrl: "/assets/combat/modes/olympus.webp",
    imageAlt: "Ciudad flotante del Olimpo cibernético",
    href: ACADEMY_TRAINING_OLYMPUS_ROUTE,
    availabilityLabel: "Entrar en Olimpo",
  },
];
