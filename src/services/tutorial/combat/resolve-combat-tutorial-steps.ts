// src/services/tutorial/combat/resolve-combat-tutorial-steps.ts - Secuencia guiada del tutorial de combate con foco en UI, turnos, invocación, trampa y fusión.
import { ITutorialFlowStep } from "@/core/entities/tutorial/ITutorialFlowStep";

export function resolveCombatTutorialSteps(): ITutorialFlowStep[] {
  return [
    { id: "combat-ui-history", title: "CombatLog", description: "Aquí revisas todos los eventos de combate en orden cronológico.", targetId: "tutorial-board-history-button", allowedTargetIds: [], completionType: "MANUAL_NEXT" },
    {
      id: "combat-ui-mute",
      title: "Mute",
      description: "Pulsa Mute para silenciar o reactivar música y efectos cuando lo necesites.",
      targetId: "tutorial-board-mute-button",
      allowedTargetIds: ["tutorial-board-actions-menu", "tutorial-board-mute-button"],
      completionType: "USER_ACTION",
      expectedActionId: "TOGGLE_MUTE",
    },
    { id: "combat-ui-auto", title: "Modo automático", description: "Automático acelera fases; en tutorial lo dejamos desactivado para aprender paso a paso.", targetId: "tutorial-board-auto-button", allowedTargetIds: [], completionType: "MANUAL_NEXT" },
    { id: "combat-ui-pause", title: "Pausa y salir", description: "Desde pausa puedes reanudar o salir del combate.", targetId: "tutorial-board-pause-button", allowedTargetIds: [], completionType: "MANUAL_NEXT" },
    { id: "combat-rules", title: "Reglas base", description: "Si empiezas primero no puedes atacar en turno 1. Solo juegas cartas si tienes energía suficiente.", targetId: "tutorial-board-phase-controls", allowedTargetIds: [], completionType: "MANUAL_NEXT" },
    { id: "combat-rules-timer", title: "Temporizador", description: "En combate normal tienes 30 segundos por subturno. Si se agota, el juego avanza al siguiente subturno automáticamente.", targetId: "tutorial-board-phase-controls", allowedTargetIds: [], completionType: "MANUAL_NEXT" },
    { id: "combat-phase-invoke", title: "Botón Invocar", description: "Este indicador muestra que estás en fase de invocación, donde bajas cartas y preparas jugadas.", targetId: "tutorial-board-phase-invoke-button", allowedTargetIds: [], completionType: "MANUAL_NEXT" },
    { id: "combat-phase-battle", title: "Botón Combate", description: "Aquí pasas de Invocación a Combate para poder declarar ataques.", targetId: "tutorial-board-phase-battle-button", allowedTargetIds: [], completionType: "MANUAL_NEXT" },
    { id: "combat-phase-pass", title: "Botón Pasar", description: "Este botón cierra tu turno y cede la iniciativa al rival.", targetId: "tutorial-board-phase-pass-button", allowedTargetIds: [], completionType: "MANUAL_NEXT" },
    { id: "combat-rules-positions", title: "Ataque vs defensa", description: "En defensa no dañas LP rival, pero sí puedes destruir cartas si tu ataque supera su defensa.", targetId: "tutorial-board-battlefield", allowedTargetIds: [], completionType: "MANUAL_NEXT" },

    { id: "combat-select-chatgpt", title: "Selecciona ChatGPT", description: "Selecciona ChatGPT en mano para desplegar acciones de invocación.", targetId: "tutorial-board-hand-card-entity-chatgpt", allowedTargetIds: ["tutorial-board-hand-card-entity-chatgpt"], completionType: "USER_ACTION", expectedActionId: "SELECT_CHATGPT" },
    { id: "combat-summon-chatgpt-attack", title: "Invoca en ataque", description: "Invoca ChatGPT en ATTACK para iniciar presión ofensiva.", targetId: "tutorial-board-action-attack", allowedTargetIds: ["tutorial-board-hand-card-entity-chatgpt", "tutorial-board-action-attack"], completionType: "USER_ACTION", expectedActionId: "SUMMON_CHATGPT_ATTACK" },
    { id: "combat-select-boost", title: "Selecciona mágica +400", description: "Selecciona la mágica de +400 ATK para potenciar tu entidad activa.", targetId: "tutorial-board-hand-card-exec-boost-atk-400", allowedTargetIds: ["tutorial-board-hand-card-exec-boost-atk-400"], completionType: "USER_ACTION", expectedActionId: "SELECT_BOOST_EXECUTION" },
    { id: "combat-activate-boost", title: "Activa la mágica", description: "Activa la ejecución y observa la mejora de ataque en tu entidad.", targetId: "tutorial-board-action-activate-execution", allowedTargetIds: ["tutorial-board-action-activate-execution", "tutorial-board-hand-card-exec-boost-atk-400"], completionType: "USER_ACTION", expectedActionId: "ACTIVATE_BOOST_EXECUTION" },
    { id: "combat-boost-result", title: "Resultado del buff", description: "La mágica ya aplicó el +400 ATQ. Fíjate en el valor actualizado antes de continuar.", targetId: "tutorial-board-battlefield", allowedTargetIds: [], completionType: "MANUAL_NEXT" },
    { id: "combat-select-trap", title: "Selecciona la trampa", description: "Ahora selecciona la trampa para dejar defensa reactiva en mesa.", targetId: "tutorial-board-hand-card-tutorial-trap-attack-drain-200", allowedTargetIds: ["tutorial-board-hand-card-tutorial-trap-attack-drain-200"], completionType: "USER_ACTION", expectedActionId: "SELECT_TUTORIAL_TRAP" },
    { id: "combat-set-trap", title: "Set de trampa", description: "Coloca la trampa en SET para que se active al ataque rival.", targetId: "tutorial-board-action-set-trap", allowedTargetIds: ["tutorial-board-action-set-trap", "tutorial-board-hand-card-tutorial-trap-attack-drain-200"], completionType: "USER_ACTION", expectedActionId: "SET_TUTORIAL_TRAP" },
    { id: "combat-subturns", title: "Subturnos", description: "Main, Battle y End tienen funciones distintas. Avanza fases para ver el turno rival.", targetId: "tutorial-board-phase-controls", allowedTargetIds: ["tutorial-board-phase-controls"], completionType: "USER_ACTION", expectedActionId: "TURN_PASSED_TO_OPPONENT" },

    { id: "combat-opponent-trap-resolution", title: "Turno rival y trampa", description: "El rival ataca, tu trampa reduce ATK y su carta termina destruida.", targetId: "tutorial-board-battlefield", allowedTargetIds: ["tutorial-board-battlefield"], completionType: "USER_ACTION", expectedActionId: "TRAP_DEFENSE_RESOLVED" },
    { id: "combat-opponent-trap-explained", title: "Qué pasó en la batalla", description: "La trampa restó 200 ATQ al atacante rival; por eso tu entidad ganó ese choque.", targetId: "tutorial-board-battlefield", allowedTargetIds: [], completionType: "MANUAL_NEXT" },
    { id: "combat-opponent-set", title: "Set del rival", description: "El rival también puede dejar cartas en SET en su zona de ejecución/trampa.", targetId: "tutorial-board-battlefield", allowedTargetIds: ["tutorial-board-battlefield"], completionType: "MANUAL_NEXT" },

    { id: "combat-select-energy-restore", title: "Selecciona recarga de energía", description: "Antes de invocar Gemini, usa la ejecución que recupera energía.", targetId: "tutorial-board-hand-card-tutorial-exec-energy-restore", allowedTargetIds: ["tutorial-board-hand-card-tutorial-exec-energy-restore"], completionType: "USER_ACTION", expectedActionId: "SELECT_ENERGY_RESTORE" },
    { id: "combat-activate-energy-restore", title: "Activa recarga", description: "Activa Recarga de Núcleo y recupera energía para seguir el turno.", targetId: "tutorial-board-action-activate-execution", allowedTargetIds: ["tutorial-board-action-activate-execution", "tutorial-board-hand-card-tutorial-exec-energy-restore"], completionType: "USER_ACTION", expectedActionId: "ACTIVATE_ENERGY_RESTORE" },
    { id: "combat-energy-restored", title: "Energía recuperada", description: "Ya recuperaste energía: ahora sí puedes invocar cartas de coste alto este turno.", targetId: "tutorial-board-phase-controls", allowedTargetIds: [], completionType: "MANUAL_NEXT" },
    { id: "combat-select-gemini", title: "Selecciona Gemini", description: "Ahora sí, selecciona Gemini para preparar sinergia de fusión con ChatGPT.", targetId: "tutorial-board-hand-card-entity-gemini", allowedTargetIds: ["tutorial-board-hand-card-entity-gemini"], completionType: "USER_ACTION", expectedActionId: "SELECT_GEMINI" },
    { id: "combat-summon-gemini", title: "Invoca Gemini", description: "Invoca Gemini y usa tus entidades para presión de mesa.", targetId: "tutorial-board-action-attack", allowedTargetIds: ["tutorial-board-action-attack", "tutorial-board-hand-card-entity-gemini"], completionType: "USER_ACTION", expectedActionId: "SUMMON_GEMINI_ATTACK" },
    { id: "combat-pass-opponent-strong", title: "Respuesta rival fuerte", description: "Pasa turno para ver un ejemplo donde una entidad rival con más ATQ gana el intercambio.", targetId: "tutorial-board-phase-controls", allowedTargetIds: ["tutorial-board-phase-controls"], completionType: "USER_ACTION", expectedActionId: "CHATGPT_DESTROYED" },
    { id: "combat-opponent-strong-explained", title: "Lectura de batalla", description: "Cuando el ATQ atacante rival supera el ATQ/DEF defensor, destruye la carta objetivo.", targetId: "tutorial-board-battlefield", allowedTargetIds: [], completionType: "MANUAL_NEXT" },

    { id: "combat-draw-and-fusion", title: "Robo y fusión", description: "Roba apoyo, invoca Python y activa Fusion Compiler para invocar GemGPT.", targetId: "tutorial-board-hand-card-exec-fusion-gemgpt", allowedTargetIds: ["tutorial-board-hand", "tutorial-board-hand-card-exec-fusion-gemgpt", "tutorial-board-action-activate-execution", "tutorial-board-battlefield"], completionType: "USER_ACTION", expectedActionId: "FUSION_SUMMON" },
    { id: "combat-opponent-defense", title: "Defensa rival", description: "El rival pondrá una carta en defensa para frenar daño directo.", targetId: "tutorial-board-battlefield", allowedTargetIds: ["tutorial-board-battlefield"], completionType: "MANUAL_NEXT" },
    { id: "combat-defense-attack-example", title: "Ejemplo de defensa", description: "Ataca una carta en DEFENSE: puede destruirse sin daño a LP rival. Luego cierra el duelo con ataque directo.", targetId: "tutorial-board-battlefield", allowedTargetIds: ["tutorial-board-battlefield"], completionType: "BOTH", expectedActionId: "MATCH_WON" },
  ];
}
