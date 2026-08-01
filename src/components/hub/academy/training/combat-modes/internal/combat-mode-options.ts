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
    imageUrl: "/assets/story/opponents/opp-ch1-jaku/intro-Jaku.webp",
    imageAlt: "Jaku preparado para combatir en la Arena clásica",
    href: ACADEMY_TRAINING_ARENA_CLASSIC_ROUTE,
    availabilityLabel: "Entrar en Arena clásica",
  },
  {
    id: "survival",
    eyebrow: "Resistencia infinita",
    title: "Supervivencia",
    description: "Encadena duelos conservando tus LP y alcanza hitos para recuperar fuerzas.",
    imageUrl: "/assets/story/opponents/opp-ch1-soldier-act01/intro-Soldado-act01.webp",
    imageAlt: "Soldado acechando en el modo Supervivencia",
    href: ACADEMY_TRAINING_SURVIVAL_ROUTE,
    availabilityLabel: "Entrar en Supervivencia",
  },
  {
    id: "olympus",
    eyebrow: "Desafío legendario",
    title: "Olimpo",
    description: "Potencia a tus campeones y desafía a leyendas con mazos exclusivos y recompensas únicas.",
    imageUrl: "/assets/combat/olympus/opponents/zeus/intro.webp",
    imageAlt: "Zeus custodiando la entrada al Olimpo",
    href: ACADEMY_TRAINING_OLYMPUS_ROUTE,
    availabilityLabel: "Entrar en Olimpo",
  },
];
