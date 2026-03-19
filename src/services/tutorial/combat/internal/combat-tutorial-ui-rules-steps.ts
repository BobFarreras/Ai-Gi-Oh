// src/services/tutorial/combat/internal/combat-tutorial-ui-rules-steps.ts - Bloque inicial de HUD y reglas base del tutorial de combate.
import { ITutorialFlowStep } from "@/core/entities/tutorial/ITutorialFlowStep";

export const COMBAT_TUTORIAL_UI_RULES_STEPS: ITutorialFlowStep[] = [
  { id: "combat-ui-history", title: "CombatLog", description: "Aquí revisas todos los eventos de combate en orden cronológico.", targetId: "tutorial-board-history-button", allowedTargetIds: [], completionType: "MANUAL_NEXT" },
  { id: "combat-ui-mute", title: "Mute", description: "Si quieres, puedes usar Mute para silenciar o reactivar música y efectos.", targetId: "tutorial-board-mute-button", allowedTargetIds: [], completionType: "MANUAL_NEXT" },
  { id: "combat-ui-auto", title: "Modo automático", description: "Automático acelera fases; en tutorial lo dejamos desactivado para aprender paso a paso.", targetId: "tutorial-board-auto-button", allowedTargetIds: [], completionType: "MANUAL_NEXT" },
  { id: "combat-ui-pause", title: "Pausa y salir", description: "Desde pausa puedes reanudar o salir del combate.", targetId: "tutorial-board-pause-button", allowedTargetIds: [], completionType: "MANUAL_NEXT" },
  { id: "combat-rules", title: "Reglas base", description: "Si empiezas primero no puedes atacar en turno 1. Solo juegas cartas si tienes energía suficiente.", targetId: "tutorial-board-phase-controls", allowedTargetIds: [], completionType: "MANUAL_NEXT" },
  { id: "combat-rules-timer", title: "Temporizador", description: "En combate normal tienes 30 segundos por subturno. Si se agota, el juego avanza al siguiente subturno automáticamente.", targetId: "tutorial-board-turn-timer-panel", allowedTargetIds: [], completionType: "MANUAL_NEXT" },
  { id: "combat-rules-positions", title: "Ataque vs defensa", description: "En defensa no dañas LP rival, pero sí puedes destruir cartas si tu ataque supera su defensa.", targetId: "tutorial-board-battlefield", allowedTargetIds: [], completionType: "MANUAL_NEXT" },
];
