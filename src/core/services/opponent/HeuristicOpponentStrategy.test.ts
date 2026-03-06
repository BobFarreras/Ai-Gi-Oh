import { describe, expect, it } from "vitest";
import { IBoardEntity } from "@/core/entities/IPlayer";
import { GameState } from "@/core/use-cases/GameEngine";
import { HeuristicOpponentStrategy } from "./HeuristicOpponentStrategy";
import { runOpponentStep } from "./runOpponentStep";

function createState(): GameState {
  return {
    playerA: {
      id: "p1",
      name: "Player",
      healthPoints: 8000,
      maxHealthPoints: 8000,
      currentEnergy: 10,
      maxEnergy: 10,
      deck: [],
      hand: [],
      graveyard: [],
      activeEntities: [],
      activeExecutions: [],
    },
    playerB: {
      id: "p2",
      name: "Bot",
      healthPoints: 8000,
      maxHealthPoints: 8000,
      currentEnergy: 6,
      maxEnergy: 10,
      deck: [],
      hand: [
        {
          id: "bot-entity",
          name: "Bot Soldier",
          description: "Entidad de combate",
          type: "ENTITY",
          faction: "OPEN_SOURCE",
          cost: 3,
          attack: 2200,
          defense: 1200,
        },
      ],
      graveyard: [],
      activeEntities: [],
      activeExecutions: [],
    },
    activePlayerId: "p2",
    startingPlayerId: "p1",
    turn: 2,
    phase: "MAIN_1",
    hasNormalSummonedThisTurn: false,
    combatLog: [],
  };
}

describe("HeuristicOpponentStrategy", () => {
  it("debería elegir una jugada válida en MAIN_1", () => {
    const strategy = new HeuristicOpponentStrategy();
    const decision = strategy.choosePlay(createState(), "p2");

    expect(decision).not.toBeNull();
    expect(decision?.cardId).toBe("bot-entity");
  });

  it("debería ejecutar flujo automático de paso de fase y ataque", () => {
    const strategy = new HeuristicOpponentStrategy();
    let state = createState();

    state = runOpponentStep(state, "p2", strategy);
    expect(state.phase).toBe("BATTLE");
    expect(state.playerB.activeEntities.length).toBe(1);

    state.playerA.activeEntities = [
      {
        instanceId: "p1-entity",
        card: {
          id: "p1-def",
          name: "Defender",
          description: "Defensa",
          type: "ENTITY",
          faction: "BIG_TECH",
          cost: 2,
          attack: 1000,
          defense: 800,
        },
        mode: "ATTACK",
        hasAttackedThisTurn: false,
        isNewlySummoned: false,
      },
    ];
    state.playerB.activeEntities = state.playerB.activeEntities.map((entity) => ({ ...entity, isNewlySummoned: false }));

    state = runOpponentStep(state, "p2", strategy);
    expect(state.playerA.activeEntities.length).toBe(0);
  });

  it("debería mantener MAIN_1 mientras existan jugadas útiles", () => {
    const strategy = new HeuristicOpponentStrategy();
    const state: GameState = {
      ...createState(),
      playerB: {
        ...createState().playerB,
        hand: [
          {
            id: "bot-ddos",
            name: "Bot DDoS",
            description: "Daño directo",
            type: "EXECUTION",
            faction: "NO_CODE",
            cost: 2,
            effect: { action: "DAMAGE", target: "OPPONENT", value: 600 },
          },
          {
            id: "bot-entity-2",
            name: "Bot Titan",
            description: "Entidad de campo",
            type: "ENTITY",
            faction: "BIG_TECH",
            cost: 3,
            attack: 2400,
            defense: 1500,
          },
        ],
      },
    };

    const nextState = runOpponentStep(state, "p2", strategy);
    expect(nextState.phase).toBe("MAIN_1");
    expect(nextState.playerB.hand.length).toBe(1);
    expect(nextState.playerB.activeEntities.length + nextState.playerB.activeExecutions.length).toBeGreaterThanOrEqual(1);
  });

  it("debería encadenar múltiples ataques en BATTLE y cerrar turno al terminar", () => {
    const strategy = new HeuristicOpponentStrategy();

    let state: GameState = {
      ...createState(),
      phase: "BATTLE",
      playerA: {
        ...createState().playerA,
        activeEntities: [
          {
            instanceId: "p1-low-1",
            card: {
              id: "p1-low-card-1",
              name: "Defender 1",
              description: "Defensa baja",
              type: "ENTITY",
              faction: "BIG_TECH",
              cost: 1,
              attack: 700,
              defense: 700,
            },
            mode: "ATTACK",
            hasAttackedThisTurn: false,
            isNewlySummoned: false,
          },
          {
            instanceId: "p1-low-2",
            card: {
              id: "p1-low-card-2",
              name: "Defender 2",
              description: "Defensa baja",
              type: "ENTITY",
              faction: "OPEN_SOURCE",
              cost: 1,
              attack: 600,
              defense: 600,
            },
            mode: "DEFENSE",
            hasAttackedThisTurn: false,
            isNewlySummoned: false,
          },
        ],
      },
      playerB: {
        ...createState().playerB,
        hand: [],
        activeEntities: [
          {
            instanceId: "p2-atk-1",
            card: {
              id: "p2-atk-card-1",
              name: "Attacker 1",
              description: "Ataque medio",
              type: "ENTITY",
              faction: "OPEN_SOURCE",
              cost: 2,
              attack: 1500,
              defense: 1000,
            },
            mode: "ATTACK",
            hasAttackedThisTurn: false,
            isNewlySummoned: false,
          },
          {
            instanceId: "p2-atk-2",
            card: {
              id: "p2-atk-card-2",
              name: "Attacker 2",
              description: "Ataque alto",
              type: "ENTITY",
              faction: "BIG_TECH",
              cost: 3,
              attack: 2300,
              defense: 1600,
            },
            mode: "ATTACK",
            hasAttackedThisTurn: false,
            isNewlySummoned: false,
          },
        ] as IBoardEntity[],
      },
    };

    state = runOpponentStep(state, "p2", strategy);
    expect(state.playerA.activeEntities).toHaveLength(1);
    expect(state.phase).toBe("BATTLE");

    state = runOpponentStep(state, "p2", strategy);
    expect(state.playerA.activeEntities).toHaveLength(0);
    expect(state.phase).toBe("BATTLE");

    state = runOpponentStep(state, "p2", strategy);
    expect(state.activePlayerId).toBe("p1");
    expect(state.phase).toBe("MAIN_1");
  });

  it("debería atacar directamente al jugador cuando no hay defensores", () => {
    const strategy = new HeuristicOpponentStrategy();
    const state: GameState = {
      ...createState(),
      phase: "BATTLE",
      playerA: {
        ...createState().playerA,
        activeEntities: [],
        healthPoints: 8000,
      },
      playerB: {
        ...createState().playerB,
        hand: [],
        activeEntities: [
          {
            instanceId: "p2-direct-1",
            card: {
              id: "p2-direct-card-1",
              name: "Direct Striker",
              description: "Atacante directo",
              type: "ENTITY",
              faction: "BIG_TECH",
              cost: 3,
              attack: 1900,
              defense: 1000,
            },
            mode: "ATTACK",
            hasAttackedThisTurn: false,
            isNewlySummoned: false,
          },
        ],
      },
    };

    const nextState = runOpponentStep(state, "p2", strategy);
    expect(nextState.playerA.healthPoints).toBe(6100);
  });

  it("debería resolver ejecución ACTIVADA del rival, aplicar daño y enviarla al cementerio", () => {
    const strategy = new HeuristicOpponentStrategy();
    const state: GameState = {
      ...createState(),
      phase: "MAIN_1",
      playerA: {
        ...createState().playerA,
        healthPoints: 8000,
      },
      playerB: {
        ...createState().playerB,
        currentEnergy: 4,
        hand: [
          {
            id: "bot-spell-dmg",
            name: "Bot Damage Script",
            description: "Daño directo",
            type: "EXECUTION",
            faction: "NO_CODE",
            cost: 2,
            effect: { action: "DAMAGE", target: "OPPONENT", value: 900 },
          },
        ],
        graveyard: [],
        activeEntities: [],
        activeExecutions: [],
      },
    };

    const afterActivate = runOpponentStep(state, "p2", strategy);
    expect(afterActivate.playerA.healthPoints).toBe(8000);
    expect(afterActivate.playerB.activeExecutions).toHaveLength(1);

    const afterResolve = runOpponentStep(afterActivate, "p2", strategy);
    expect(afterResolve.playerA.healthPoints).toBe(7100);
    expect(afterResolve.playerB.activeExecutions).toHaveLength(0);
    expect(afterResolve.playerB.graveyard.some((card) => card.id === "bot-spell-dmg")).toBe(true);
  });

  it("debería evitar intercambios malos en HARD y permitirlos en EASY", () => {
    const hardStrategy = new HeuristicOpponentStrategy({ difficulty: "HARD" });
    const easyStrategy = new HeuristicOpponentStrategy({ difficulty: "EASY" });

    const state: GameState = {
      ...createState(),
      phase: "BATTLE",
      playerA: {
        ...createState().playerA,
        activeEntities: [
          {
            instanceId: "p1-wall",
            card: {
              id: "p1-wall-card",
              name: "Muralla",
              description: "Defensa elevada",
              type: "ENTITY",
              faction: "BIG_TECH",
              cost: 3,
              attack: 800,
              defense: 2600,
            },
            mode: "DEFENSE",
            hasAttackedThisTurn: false,
            isNewlySummoned: false,
          },
        ],
      },
      playerB: {
        ...createState().playerB,
        hand: [],
        activeEntities: [
          {
            instanceId: "p2-weak-attacker",
            card: {
              id: "p2-weak-attacker-card",
              name: "Probe",
              description: "Atacante débil",
              type: "ENTITY",
              faction: "OPEN_SOURCE",
              cost: 1,
              attack: 1000,
              defense: 700,
            },
            mode: "ATTACK",
            hasAttackedThisTurn: false,
            isNewlySummoned: false,
          },
        ],
      },
    };

    expect(hardStrategy.chooseAttack(state, "p2")).toBeNull();
    expect(easyStrategy.chooseAttack(state, "p2")).not.toBeNull();
  });

  it("debería atacar para cerrar partida aunque el score base sea bajo", () => {
    const hardStrategy = new HeuristicOpponentStrategy({ difficulty: "HARD" });
    const state: GameState = {
      ...createState(),
      phase: "BATTLE",
      playerA: {
        ...createState().playerA,
        healthPoints: 1200,
        activeEntities: [],
      },
      playerB: {
        ...createState().playerB,
        hand: [],
        activeEntities: [
          {
            instanceId: "p2-lethal",
            card: {
              id: "p2-lethal-card",
              name: "Lethal",
              description: "Cierra partida",
              type: "ENTITY",
              faction: "BIG_TECH",
              cost: 4,
              attack: 1500,
              defense: 800,
            },
            mode: "ATTACK",
            hasAttackedThisTurn: false,
            isNewlySummoned: false,
          },
        ],
      },
    };

    expect(hardStrategy.chooseAttack(state, "p2")).not.toBeNull();
  });

  it("debería permitir un trade negativo si limpia una amenaza crítica", () => {
    const hardStrategy = new HeuristicOpponentStrategy({ difficulty: "HARD" });
    const state: GameState = {
      ...createState(),
      phase: "BATTLE",
      playerA: {
        ...createState().playerA,
        activeEntities: [
          {
            instanceId: "p1-threat",
            card: {
              id: "p1-threat-card",
              name: "Threat",
              description: "Amenaza crítica",
              type: "ENTITY",
              faction: "BIG_TECH",
              cost: 7,
              attack: 3000,
              defense: 3000,
            },
            mode: "ATTACK",
            hasAttackedThisTurn: false,
            isNewlySummoned: false,
          },
        ],
      },
      playerB: {
        ...createState().playerB,
        hand: [],
        activeEntities: [
          {
            instanceId: "p2-clear",
            card: {
              id: "p2-clear-card",
              name: "Clearer",
              description: "Intercambio",
              type: "ENTITY",
              faction: "OPEN_SOURCE",
              cost: 3,
              attack: 3000,
              defense: 100,
            },
            mode: "ATTACK",
            hasAttackedThisTurn: false,
            isNewlySummoned: false,
          },
        ],
      },
    };

    const decision = hardStrategy.chooseAttack(state, "p2");
    expect(decision).not.toBeNull();
    expect(decision?.defenderInstanceId).toBe("p1-threat");
  });

  it("debería fusionar cuando tiene receta válida y materiales en campo", () => {
    const strategy = new HeuristicOpponentStrategy({ difficulty: "HARD" });
    const state: GameState = {
      ...createState(),
      playerB: {
        ...createState().playerB,
        hand: [
          {
            id: "fusion-p2-overmind",
            name: "Smith Overmind",
            description: "Fusion",
            type: "FUSION",
            faction: "BIG_TECH",
            cost: 6,
            attack: 2800,
            defense: 2000,
            fusionRecipeId: "fusion-p2-overmind",
          },
        ],
        activeEntities: [
          {
            instanceId: "core-1",
            card: {
              id: "core-card-1",
              name: "Core 1",
              description: "mat",
              type: "ENTITY",
              faction: "BIG_TECH",
              cost: 2,
              attack: 800,
              defense: 1000,
              archetype: "LLM",
            },
            mode: "ATTACK",
            hasAttackedThisTurn: false,
            isNewlySummoned: false,
          },
          {
            instanceId: "core-2",
            card: {
              id: "core-card-2",
              name: "Core 2",
              description: "mat",
              type: "ENTITY",
              faction: "OPEN_SOURCE",
              cost: 3,
              attack: 1100,
              defense: 1050,
              archetype: "LLM",
            },
            mode: "ATTACK",
            hasAttackedThisTurn: false,
            isNewlySummoned: false,
          },
        ],
      },
    };

    const nextState = runOpponentStep(state, "p2", strategy);
    expect(nextState.playerB.activeEntities.some((entity) => entity.card.type === "FUSION")).toBe(true);
  });
});
