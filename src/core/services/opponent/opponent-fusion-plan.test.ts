// src/core/services/opponent/opponent-fusion-plan.test.ts - Ficha 5 fase 4: la IA no arranca fusiones
// inviables (material que moriría antes de juntar el par) ni malgasta el ejecutable antes de tener los
// materiales completos. El simulador reveló que, si no, los mazos de fusión "alimentaban materiales a la
// muerte" toda la partida.
import { describe, expect, it } from "vitest";
import { GameState } from "@/core/use-cases/GameEngine";
import { IPlayer } from "@/core/entities/IPlayer";
import { chooseFusionSetupPlay } from "./opponent-fusion-plan";
import { buildPlayableCardDecisions } from "./select-opponent-play";
import { getDifficultyProfile } from "./difficulty/difficultyProfiles";
import { createBaseState, createBoardEntity } from "./HeuristicOpponentStrategy.test-fixtures";
import { EXECUTION_CARDS } from "@/core/data/mock-cards/executions";
import { ENTITY_CARDS } from "@/core/data/mock-cards/entities";
import { FUSION_CARDS } from "@/core/data/mock-cards/fusions";

const fusionExec = { ...EXECUTION_CARDS.find((card) => card.id === "exec-fusion-pytgress")! };
const pytgress = { ...FUSION_CARDS.find((card) => card.id === "fusion-pytgress")! }; // carta resultado
const python = { ...ENTITY_CARDS.find((card) => card.id === "entity-python")! }; // material (LANGUAGE)
const postgress = { ...ENTITY_CARDS.find((card) => card.id === "entity-postgress")! }; // material (DB)

function botWith(overrides: Partial<IPlayer>): IPlayer {
  const base = createBaseState().playerB;
  // fusionDeck con la carta resultado: la IA solo planifica una fusión que PUEDE completar (si no está en el
  // fusionDeck, el ejecutable nunca activaría → planificar materiales sería en balde).
  return { ...base, currentEnergy: 10, hand: [], activeEntities: [], activeExecutions: [], fusionDeck: [{ ...pytgress }], ...overrides };
}

function plan(state: GameState, bot: IPlayer, target: IPlayer) {
  const playable = buildPlayableCardDecisions({ opponent: bot, target, profile: getDifficultyProfile("HARD"), aiProfile: { style: "balanced", aggression: 0.5 } });
  return chooseFusionSetupPlay(state, bot, target, playable);
}

describe("chooseFusionSetupPlay (ficha 5 fase 4)", () => {
  it("con el tablero rival vacío (sin amenaza), arranca la fusión invocando un material", () => {
    const base = createBaseState();
    const bot = botWith({ hand: [{ ...fusionExec }, { ...python }, { ...postgress }] });
    const decision = plan({ ...base, playerB: bot }, bot, base.playerA);
    expect(decision?.cardId).toBe("entity-postgress"); // el mejor material por score
  });

  it("NO invoca un material que morirá al mejor atacante rival (deja de alimentarlos a la muerte)", () => {
    const base = createBaseState();
    // Atacante rival de 2600 EN ATAQUE: ni python (1100 DEF) ni postgress (1100 DEF) aguantan.
    const target = { ...base.playerA, activeEntities: [createBoardEntity("threat", { id: "big", name: "Big", description: "", type: "ENTITY", faction: "NEUTRAL", cost: 6, attack: 2600, defense: 1600 }, "ATTACK")] };
    const bot = botWith({ hand: [{ ...fusionExec }, { ...python }, { ...postgress }] });
    const decision = plan({ ...base, playerA: target, playerB: bot }, bot, target);
    // Lo clave: NO invoca un material a morir. (Puede setear el ejecutable, que no regala nada.)
    expect(decision?.cardId).not.toBe("entity-python");
    expect(decision?.cardId).not.toBe("entity-postgress");
  });

  it("con la fusión YA empezada (un material en mesa) la termina aunque haya amenaza", () => {
    const base = createBaseState();
    const target = { ...base.playerA, activeEntities: [createBoardEntity("threat", { id: "big", name: "Big", description: "", type: "ENTITY", faction: "NEUTRAL", cost: 6, attack: 2600, defense: 1600 }, "ATTACK")] };
    // python ya en mesa (empezada); en mano el otro material.
    const bot = botWith({ activeEntities: [createBoardEntity("p-inst", { ...python })], hand: [{ ...fusionExec }, { ...postgress }] });
    const decision = plan({ ...base, playerA: target, playerB: bot }, bot, target);
    expect(decision?.cardId).toBe("entity-postgress");
  });
});
