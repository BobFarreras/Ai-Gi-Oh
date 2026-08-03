// src/core/use-cases/match/replay-combat-proof.test.ts - Verifica replay autoritativo, límites y resultado derivado de una prueba de combate.
import { describe, expect, it } from "vitest";
import { ICombatProof, ICombatSession } from "@/core/entities/match";
import { createInitialGameState } from "@/core/use-cases/game-engine/state/create-initial-game-state";
import { GameState } from "@/core/use-cases/game-engine/state/types";
import { replayCombatProof } from "./replay-combat-proof";
import { applyMatchAction } from "@/core/services/multiplayer/apply-match-action";

const cards = [{ id: "entity-test", name: "Test", description: "Test", type: "ENTITY" as const, faction: "NEUTRAL" as const, cost: 1, attack: 1000, defense: 1000 }];

function createSession(partial: Partial<ICombatSession> = {}): ICombatSession {
  return {
    id: "session-1",
    battleId: "battle-1",
    mode: "SURVIVAL",
    playerId: "p1",
    opponentId: "p2",
    seed: "seed-1",
    snapshotHash: "sha256:snapshot",
    protocolVersion: 1,
    issuedAtIso: "2026-07-29T10:00:00.000Z",
    expiresAtIso: "2026-07-29T11:00:00.000Z",
    ...partial,
  };
}

function createProof(partial: Partial<ICombatProof> = {}): ICombatProof {
  return {
    sessionId: "session-1",
    battleId: "battle-1",
    mode: "SURVIVAL",
    snapshotHash: "sha256:snapshot",
    protocolVersion: 1,
    entries: [{ sequence: 1, actorPlayerId: "p1", action: { type: "NEXT_PHASE", payload: {} } }],
    ...partial,
  };
}

function createState(): GameState {
  return createInitialGameState({
    playerA: { id: "p1", name: "Player", deck: cards },
    playerB: { id: "p2", name: "Opponent", deck: cards },
    starterPlayerId: "p1",
  });
}

describe("replayCombatProof", () => {
  it("reproduce acciones y deriva ganador y LP sin aceptar outcome del cliente", () => {
    const result = replayCombatProof({
      session: createSession(),
      proof: createProof(),
      nowIso: "2026-07-29T10:30:00.000Z",
      initialStateFactory: createState,
      applyAction: (state) => ({
        ...state,
        playerB: { ...state.playerB, healthPoints: 0 },
      }),
    });

    expect(result.winnerPlayerId).toBe("p1");
    expect(result.playerEndingHealthPoints).toBe(8000);
    expect(result.opponentEndingHealthPoints).toBe(0);
    expect(result.flawless).toBe(true);
  });

  it("mide impecable contra los LP con los que empezó la batalla, no contra el máximo", () => {
    const carriedOverLp = 3200;
    const common = {
      session: createSession(),
      proof: createProof(),
      nowIso: "2026-07-29T10:30:00.000Z",
      initialStateFactory: () => {
        const state = createState();
        return { ...state, playerA: { ...state.playerA, healthPoints: carriedOverLp } };
      },
    };

    const untouched = replayCombatProof({
      ...common,
      applyAction: (state) => ({ ...state, playerB: { ...state.playerB, healthPoints: 0 } }),
    });
    const damaged = replayCombatProof({
      ...common,
      applyAction: (state) => ({
        ...state,
        playerA: { ...state.playerA, healthPoints: carriedOverLp - 500 },
        playerB: { ...state.playerB, healthPoints: 0 },
      }),
    });

    expect(untouched.playerEndingHealthPoints).toBe(carriedOverLp);
    expect(untouched.flawless).toBe(true);
    expect(damaged.flawless).toBe(false);
  });

  it("rechaza secuencias desordenadas, snapshots manipulados y pruebas expiradas", () => {
    const common = { nowIso: "2026-07-29T10:30:00.000Z", initialStateFactory: createState, applyAction: (state: GameState) => state };
    expect(() => replayCombatProof({ ...common, session: createSession(), proof: createProof({ entries: [{ ...createProof().entries[0], sequence: 2 }] }) })).toThrow("secuencia");
    expect(() => replayCombatProof({ ...common, session: createSession(), proof: createProof({ snapshotHash: "alterado" }) })).toThrow("snapshot");
    // Caducada muy por encima del margen de liquidación (sesión de 08:00 a 08:30, ahora 10:30).
    const staleSession = createSession({ issuedAtIso: "2026-07-29T08:00:00.000Z", expiresAtIso: "2026-07-29T08:30:00.000Z" });
    expect(() => replayCombatProof({ ...common, session: staleSession, proof: createProof() })).toThrow("expirada");
  });

  it("admite liquidar un duelo que se alargó más que la ventana de la sesión", () => {
    const result = replayCombatProof({
      // La sesión caducó hace diez minutos: el jugador terminó tarde, no abandonó.
      session: createSession({ expiresAtIso: "2026-07-29T10:20:00.000Z" }),
      proof: createProof(),
      nowIso: "2026-07-29T10:30:00.000Z",
      initialStateFactory: createState,
      applyAction: (state) => ({ ...state, playerB: { ...state.playerB, healthPoints: 0 } }),
    });

    expect(result.winnerPlayerId).toBe("p1");
  });

  it("rechaza otra sesión, otro modo y diarios excesivos", () => {
    const common = { session: createSession(), nowIso: "2026-07-29T10:30:00.000Z", initialStateFactory: createState, applyAction: (state: GameState) => state };
    expect(() => replayCombatProof({ ...common, proof: createProof({ sessionId: "otra" }) })).toThrow("sesión");
    expect(() => replayCombatProof({ ...common, proof: createProof({ mode: "OLYMPUS" }) })).toThrow("modo");
    expect(() => replayCombatProof({ ...common, proof: createProof({ entries: [{ ...createProof().entries[0], actorPlayerId: "intruso" }] }) })).toThrow("actor ajeno");
    expect(() => replayCombatProof({ ...common, proof: createProof({ entries: Array.from({ length: 501 }, (_, index) => ({ sequence: index + 1, actorPlayerId: "p1", action: { type: "NEXT_PHASE" as const, payload: {} } })) }) })).toThrow("acciones");
  });

  it("rechaza una prueba que no concluye el duelo", () => {
    expect(() =>
      replayCombatProof({
        session: createSession(),
        proof: createProof(),
        nowIso: "2026-07-29T10:30:00.000Z",
        initialStateFactory: createState,
        applyAction: (state) => state,
      }),
    ).toThrow("no concluye");
  });

  it("converge usando el aplicador real compartido con multiplayer", () => {
    const result = replayCombatProof({
      session: createSession(),
      proof: createProof(),
      nowIso: "2026-07-29T10:30:00.000Z",
      initialStateFactory: () => {
        const state = createState();
        return {
          ...state,
          turn: 29,
          phase: "BATTLE",
          playerB: { ...state.playerB, healthPoints: 7000 },
        };
      },
      applyAction: applyMatchAction,
    });

    expect(result.turn).toBe(30);
    expect(result.winnerPlayerId).toBe("p1");
  });
});
