// src/components/hub/academy/training/combat-modes/internal/combat-mode.types.ts - Contratos visuales del portal de combate.
export type CombatModeTone = "classic" | "survival" | "olympus";

export interface ICombatModeOption {
  id: CombatModeTone;
  title: string;
  eyebrow: string;
  description: string;
  imageUrl: string;
  imageAlt: string;
  href?: string;
  availabilityLabel: string;
}
