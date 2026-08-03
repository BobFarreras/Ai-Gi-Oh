// src/core/use-cases/match/replay-combat-proof.derived-opponent.test.ts - Verifica que el rival lo juega el servidor y no el journal del cliente.
import { describe, expect, it } from "vitest";
import { ICombatProof, ICombatSession, IMatchActionPayload } from "@/core/entities/match";
import { applyMatchAction } from "@/core/services/multiplayer/apply-match-action";
import { HeuristicOpponentStrategy } from "@/core/services/opponent/HeuristicOpponentStrategy";
import { createInitialGameState } from "@/core/use-cases/game-engine/state/create-initial-game-state";
import { createSeededGameEngineIdFactory } from "@/core/use-cases/game-engine/state/id-factory";
import { GameState } from "@/core/use-cases/game-engine/state/types";
import { replayCombatProof } from "./replay-combat-proof";
import { deriveOpponentTurn } from "./internal/derive-opponent-turn";

const card = {
  id: "entity-test",
  name: "Test",
  description: "Test",
  type: "ENTITY" as const,
  faction: "NEUTRAL" as const,
  cost: 1,
  attack: 1500,
  defense: 1000,
};
const deck = Array.from({ length: 20 }, () => ({ ...card }));

// El snapshot lo crea el servidor una vez y se persiste; aquí se clona igual que en producción.
const SNAPSHOT = createInitialGameState({
  playerA: { id: "p1", name: "Player", deck },
  playerB: { id: "p2", name: "Opponent", deck },
  starterPlayerId: "p1",
  idFactory: createSeededGameEngineIdFactory("seed-1"),
});

function createState(): GameState {
  const cloned = structuredClone({ ...SNAPSHOT, idFactory: undefined }) as GameState;
  cloned.idFactory = createSeededGameEngineIdFactory("seed-1");
  return cloned;
}

const session: ICombatSession = {
  id: "session-1",
  battleId: "battle-1",
  mode: "SURVIVAL",
  playerId: "p1",
  opponentId: "p2",
  seed: "seed-1",
  snapshotHash: "hash",
  protocolVersion: 3,
  issuedAtIso: "2026-07-31T10:00:00.000Z",
  expiresAtIso: "2026-07-31T11:00:00.000Z",
};

function buildProof(entries: { actor: string; action: IMatchActionPayload }[]): ICombatProof {
  return {
    sessionId: session.id,
    battleId: session.battleId,
    mode: "SURVIVAL",
    snapshotHash: session.snapshotHash,
    protocolVersion: session.protocolVersion,
    entries: entries.map((entry, index) => ({
      sequence: index + 1,
      actorPlayerId: entry.actor,
      action: entry.action,
    })),
  };
}

function replay(proof: ICombatProof) {
  return replayCombatProof({
    session,
    proof,
    nowIso: "2026-07-31T10:30:00.000Z",
    initialStateFactory: createState,
    applyAction: applyMatchAction,
    deriveOpponent: { strategy: new HeuristicOpponentStrategy({ difficulty: "BOSS" }) },
  });
}

describe("replayCombatProof con rival derivado", () => {
  it("rechaza un journal que declara jugadas del rival", () => {
    const proof = buildProof([
      { actor: "p1", action: { type: "NEXT_PHASE", payload: {} } },
      { actor: "p2", action: { type: "NEXT_PHASE", payload: {} } },
    ]);

    expect(() => replay(proof)).toThrow("no puede declarar acciones del rival");
  });

  it("no acepta una victoria fabricada pasando el turno del rival por él", () => {
    // Exactamente el exploit original: el cliente pasa la fase del rival para que nunca juegue.
    const proof = buildProof([
      { actor: "p1", action: { type: "PLAY_CARD", payload: { cardId: "entity-test", mode: "ATTACK" } } },
      { actor: "p1", action: { type: "NEXT_PHASE", payload: {} } },
      { actor: "p1", action: { type: "NEXT_PHASE", payload: {} } },
      { actor: "p1", action: { type: "NEXT_PHASE", payload: {} } },
      { actor: "p1", action: { type: "NEXT_PHASE", payload: {} } },
    ]);

    // Antes esto liquidaba victoria impecable con el rival sin jugar una sola carta. Ahora el servidor
    // juega sus turnos, el journal deja de cuadrar y la prueba se rechaza en vez de acreditar nada.
    expect(() => replay(proof)).toThrow("no concluye el duelo");
  });

  it("juega el turno del rival sin consumir acciones del journal", () => {
    const opponentTurnState = { ...createState(), activePlayerId: "p2", phase: "MAIN_1" as const, turn: 2 };

    const derived = deriveOpponentTurn({
      state: opponentTurnState,
      opponentId: "p2",
      entries: [],
      cursor: 0,
      derivation: { strategy: new HeuristicOpponentStrategy({ difficulty: "BOSS" }) },
      applyAction: applyMatchAction,
      stepsTaken: 0,
    });

    // Sin una sola acción declarada, el rival ya jugó su turno y devolvió la iniciativa al jugador.
    expect(derived.state.activePlayerId).toBe("p1");
    expect(derived.stepsTaken).toBeGreaterThan(0);
    expect(derived.cursor).toBe(0);
  });
});
