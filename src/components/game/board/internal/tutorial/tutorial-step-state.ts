// src/components/game/board/internal/tutorial/tutorial-step-state.ts - Resuelve estado de pasos del tutorial de combate con reglas automáticas y confirmaciones manuales.
export interface ITutorialGuideRuntime {
  turn: number;
  selectedCard: boolean;
  hasPlayedEntity: boolean;
  hasBattleResolved: boolean;
  hasPlayedExecution: boolean;
  hasFusionSummon: boolean;
  isGraveyardOpen: boolean;
  hasReviveInteraction: boolean;
  isCombatLogOpen: boolean;
  hasWinner: boolean;
}

export interface ITutorialGuideStep {
  id: string;
  title: string;
  description: string;
  requiresAck: boolean;
  isCompleted: boolean;
}

/**
 * Construye la secuencia canónica del tutorial para mantener explicación y validación en un único punto.
 */
export function resolveTutorialGuideSteps(runtime: ITutorialGuideRuntime, ackedStepIds: Set<string>): ITutorialGuideStep[] {
  const hasAck = (id: string) => ackedStepIds.has(id);
  const hasFirstTurnPassed = runtime.turn > 1;
  return [
    {
      id: "first-turn-rule",
      title: "Regla del primer turno",
      description: "El jugador inicial no puede atacar en el turno 1. Debes preparar tu campo antes de entrar en combate.",
      requiresAck: true,
      isCompleted: hasAck("first-turn-rule") || hasFirstTurnPassed,
    },
    {
      id: "select-card",
      title: "Seleccionar carta",
      description: "Selecciona una carta de tu mano para ver acciones disponibles y planear tu jugada.",
      requiresAck: false,
      isCompleted: runtime.selectedCard || runtime.hasPlayedEntity,
    },
    {
      id: "attack-defense",
      title: "Ataque y defensa",
      description: "Invoca una entidad y observa cómo cambia el resultado al usar modo ATTACK o DEFENSE.",
      requiresAck: false,
      isCompleted: runtime.hasPlayedEntity,
    },
    {
      id: "battle-resolution",
      title: "Resolución de combate",
      description: "Declara un ataque y revisa cómo el motor calcula daño directo o destrucción de entidades.",
      requiresAck: false,
      isCompleted: runtime.hasBattleResolved,
    },
    {
      id: "execution-card",
      title: "Activar mágica",
      description: "Juega una carta EXECUTION para aplicar efectos tácticos durante MAIN_1.",
      requiresAck: false,
      isCompleted: runtime.hasPlayedExecution,
    },
    {
      id: "fusion-summon",
      title: "Fusión",
      description: "Combina materiales válidos y ejecuta una fusión para crear una entidad superior.",
      requiresAck: false,
      isCompleted: runtime.hasFusionSummon,
    },
    {
      id: "graveyard-revive",
      title: "Cementerio y revive",
      description: "Abre el cementerio y aprende cómo algunas cartas recuperan unidades desde allí.",
      requiresAck: true,
      isCompleted: runtime.isGraveyardOpen || runtime.hasReviveInteraction || hasAck("graveyard-revive"),
    },
    {
      id: "combat-log",
      title: "CombatLog",
      description: "Abre el CombatLog para entender cada evento de fase, daño, destrucción y efectos.",
      requiresAck: false,
      isCompleted: runtime.isCombatLogOpen,
    },
    {
      id: "victory-condition",
      title: "Condición de victoria",
      description: "Un duelo termina cuando la vida de un jugador llega a 0. El resultado resume por qué ganaste o perdiste.",
      requiresAck: false,
      isCompleted: runtime.hasWinner,
    },
  ];
}
