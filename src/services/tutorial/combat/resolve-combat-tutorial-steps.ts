// src/services/tutorial/combat/resolve-combat-tutorial-steps.ts - Orquesta el catálogo completo de pasos del tutorial de combate por bloques SRP.
import { ITutorialFlowStep } from "@/core/entities/tutorial/ITutorialFlowStep";
import { COMBAT_TUTORIAL_UI_RULES_STEPS } from "@/services/tutorial/combat/internal/combat-tutorial-ui-rules-steps";
import { COMBAT_TUTORIAL_OPENING_STEPS } from "@/services/tutorial/combat/internal/combat-tutorial-opening-steps";
import { COMBAT_TUTORIAL_MIDGAME_STEPS } from "@/services/tutorial/combat/internal/combat-tutorial-midgame-steps";
import { COMBAT_TUTORIAL_FUSION_STEPS } from "@/services/tutorial/combat/internal/combat-tutorial-fusion-steps";
import { COMBAT_TUTORIAL_ENDGAME_STEPS } from "@/services/tutorial/combat/internal/combat-tutorial-endgame-steps";

/**
 * Devuelve un flujo declarativo estable de combate para el motor tutorial.
 */
export function resolveCombatTutorialSteps(): ITutorialFlowStep[] {
  return [
    ...COMBAT_TUTORIAL_UI_RULES_STEPS,
    ...COMBAT_TUTORIAL_OPENING_STEPS,
    ...COMBAT_TUTORIAL_MIDGAME_STEPS,
    ...COMBAT_TUTORIAL_FUSION_STEPS,
    ...COMBAT_TUTORIAL_ENDGAME_STEPS,
  ];
}
