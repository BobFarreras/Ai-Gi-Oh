// src/core/use-cases/game-engine/phases/revive-instance-id-determinism.integration.test.ts - Regresión del desync
// multijugador: el instanceId de una carta revivida (Antigrabity) debe salir idéntico en ambos clientes aunque
// sus contadores de combat log hayan divergido por eventos locales (telemetría de turno, EXP), y el ataque del
// rival contra esa carta debe resolver igual en los dos lados.
import { describe, expect, it } from "vitest";
import { ICard } from "@/core/entities/ICard";
import { applyMatchAction } from "@/core/services/multiplayer/apply-match-action";
import { REVIVE_NEXT_TURN_PASSIVE_ID } from "@/core/services/progression/mastery-passive-ids";
import { GameEngine, GameState } from "@/core/use-cases/GameEngine";
import { appendCombatLogEvent } from "@/core/use-cases/game-engine/logging/combat-log";
import { createSeededGameEngineIdFactory } from "@/core/use-cases/game-engine/state/id-factory";
import { createTestBoardEntity, createTestGameState, createTestPlayer } from "@/core/use-cases/game-engine/test-support/state-fixtures";

const MATCH_SEED = "match-seed-antigrabity";

const antigrabityCard: ICard = {
  id: "entity-antigrabity",
  runtimeId: "p2-entity-antigrabity-4-k3f9a1",
  name: "Antigrabity",
  description: "Revive al inicio de tu turno",
  type: "ENTITY",
  faction: "NEUTRAL",
  cost: 3,
  attack: 1500,
  defense: 900,
  masteryPassiveSkillId: REVIVE_NEXT_TURN_PASSIVE_ID,
};

const trapCard: ICard = {
  id: "trap-contraataque",
  name: "Contraataque",
  description: "Daña al rival cuando declara un ataque",
  type: "TRAP",
  faction: "NEUTRAL",
  cost: 2,
  trigger: "ON_OPPONENT_ATTACK_DECLARED",
  effect: { action: "DAMAGE", target: "OPPONENT", value: 500 },
};

/** Estado compartido: p1 (yo) con una trampa puesta y sin entities; p2 (rival) con Antigrabity en el cementerio. */
function createClientState(): GameState {
  return createTestGameState({
    playerA: createTestPlayer("p1", { activeExecutions: [createTestBoardEntity("trap-1", trapCard, "SET")] }),
    playerB: createTestPlayer("p2", { graveyard: [antigrabityCard] }),
    activePlayerId: "p1",
    startingPlayerId: "p1",
    turn: 2,
    phase: "BATTLE",
    idFactory: createSeededGameEngineIdFactory(MATCH_SEED),
  });
}

/** Turno de p1 → arranca el turno de p2 (revive Antigrabity) → p2 entra en BATTLE. */
function advanceToRivalBattlePhase(state: GameState): GameState {
  return GameEngine.nextPhase(GameEngine.nextPhase(state));
}

describe("determinismo del instanceId de cartas revividas (multijugador)", () => {
  it("mantiene el mismo instanceId en ambos clientes aunque uno haya escrito eventos de log locales", () => {
    // Cliente del rival: limpio. Cliente mío: la telemetría de turno (diálogo de guardia, auto-avance de fase)
    // escribe eventos de combat log que NUNCA viajan al rival y adelantan mi contador de ids.
    const rivalClient = advanceToRivalBattlePhase(createClientState());
    const myClient = advanceToRivalBattlePhase(
      appendCombatLogEvent(appendCombatLogEvent(createClientState(), "p1", "TURN_GUARD_SHOWN", {}), "p1", "TURN_GUARD_CONFIRMED", {}),
    );

    const rivalRevivedId = rivalClient.playerB.activeEntities[0]?.instanceId;
    const myRevivedId = myClient.playerB.activeEntities[0]?.instanceId;

    expect(rivalRevivedId).toBeDefined();
    expect(myRevivedId).toBe(rivalRevivedId);
  });

  it("resuelve en mi cliente el ataque del rival con la carta revivida: salta mi trampa y bajan mis LP", () => {
    const rivalClient = advanceToRivalBattlePhase(createClientState());
    const myClient = advanceToRivalBattlePhase(
      appendCombatLogEvent(createClientState(), "p1", "AUTO_PHASE_ADVANCED", {}),
    );

    // El rival declara el ataque directo con SU instanceId y lo emite por Realtime.
    const attackerInstanceId = rivalClient.playerB.activeEntities[0].instanceId;
    const action = { type: "ATTACK", payload: { attackerInstanceId } } as const;

    const rivalAfter = applyMatchAction(rivalClient, "p2", action);
    const myAfter = applyMatchAction(myClient, "p2", action);

    // Los dos clientes ven lo mismo: trampa consumida, daño de la trampa al rival y mis LP al descubierto.
    expect(myAfter.playerA.healthPoints).toBe(rivalAfter.playerA.healthPoints);
    expect(myAfter.playerB.healthPoints).toBe(rivalAfter.playerB.healthPoints);
    expect(myAfter.playerA.healthPoints).toBe(8000 - (antigrabityCard.attack ?? 0));
    expect(myAfter.playerB.healthPoints).toBe(8000 - 500);
    expect(myAfter.playerA.activeExecutions).toHaveLength(0);
    expect(myAfter.playerA.graveyard.some((card) => card.id === trapCard.id)).toBe(true);
  });
});
