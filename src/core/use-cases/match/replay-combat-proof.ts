// src/core/use-cases/match/replay-combat-proof.ts - Reproduce un journal validado y deriva el resultado autoritativo del duelo.
import { CombatProofError } from "@/core/errors/CombatProofError";
import { COMBAT_SETTLEMENT_GRACE_MS, ICombatProof, ICombatSession, IMatchActionPayload } from "@/core/entities/match";
import { resolveWinnerPlayerId } from "@/core/services/turn/resolve-winner-player-id";
import { DEFAULT_COMBAT_ACTION_LIMIT } from "@/core/services/match/combat-action-journal";
import { GameState } from "@/core/use-cases/game-engine/state/types";
import { deriveOpponentTurn, IOpponentDerivation } from "./internal/derive-opponent-turn";

const DEFAULT_MAX_PROOF_BYTES = 256 * 1024;

interface IReplayCombatProofInput {
  session: ICombatSession;
  proof: ICombatProof;
  nowIso: string;
  initialStateFactory: () => GameState;
  applyAction: (state: GameState, actorPlayerId: string, action: IMatchActionPayload) => GameState;
  /** Presente en los modos donde el rival es IA: el servidor lo juega en vez de creerse al cliente. */
  deriveOpponent?: IOpponentDerivation;
  maxActions?: number;
  maxProofBytes?: number;
}

export interface ICombatReplayResult {
  winnerPlayerId: string | "DRAW";
  playerEndingHealthPoints: number;
  opponentEndingHealthPoints: number;
  turn: number;
  flawless: boolean;
  finalState: GameState;
}

function assertIdentity(session: ICombatSession, proof: ICombatProof): void {
  if (proof.sessionId !== session.id || proof.battleId !== session.battleId) {
    throw new CombatProofError("La prueba no corresponde a la sesión de combate.");
  }
  if (proof.mode !== session.mode) throw new CombatProofError("La prueba no corresponde al modo de combate.");
  if (proof.snapshotHash !== session.snapshotHash) throw new CombatProofError("El snapshot de la prueba ha sido manipulado.");
  if (proof.protocolVersion !== session.protocolVersion) throw new CombatProofError("La versión del protocolo no coincide.");
}

function assertWindow(session: ICombatSession, nowIso: string): void {
  const nowMs = Date.parse(nowIso);
  const issuedAtMs = Date.parse(session.issuedAtIso);
  const expiresAtMs = Date.parse(session.expiresAtIso);
  if (![nowMs, issuedAtMs, expiresAtMs].every(Number.isFinite) || expiresAtMs <= issuedAtMs) {
    throw new CombatProofError("La ventana temporal de la sesión es inválida.");
  }
  // Terminar el duelo tarde no debe costar la victoria: la caducidad de la sesión decide abandono,
  // no si una prueba ya concluida puede liquidarse.
  if (nowMs < issuedAtMs || nowMs > expiresAtMs + COMBAT_SETTLEMENT_GRACE_MS) {
    throw new CombatProofError("La prueba de combate está expirada.");
  }
}

function assertJournal(proof: ICombatProof, maxActions: number, maxProofBytes: number): void {
  if (proof.entries.length > maxActions) throw new CombatProofError("La prueba supera el límite de acciones.");
  if (new TextEncoder().encode(JSON.stringify(proof)).byteLength > maxProofBytes) {
    throw new CombatProofError("La prueba supera el tamaño permitido.");
  }
  proof.entries.forEach((entry, index) => {
    if (entry.sequence !== index + 1) throw new CombatProofError("La secuencia de acciones es inválida.");
    if (!entry.actorPlayerId.trim()) throw new CombatProofError("Una acción no contiene actor válido.");
  });
}

function assertStateParticipants(state: GameState, session: ICombatSession): void {
  const ids = new Set([state.playerA.id, state.playerB.id]);
  if (!ids.has(session.playerId) || !ids.has(session.opponentId) || session.playerId === session.opponentId) {
    throw new CombatProofError("Los participantes no coinciden con el snapshot de la sesión.");
  }
}

/**
 * Intercala las acciones del jugador con los turnos que el servidor juega por el rival, de modo que el
 * journal solo aporta lo que el servidor no puede derivar.
 */
function replayWithDerivedOpponent(
  input: IReplayCombatProofInput,
  initialState: GameState,
  derivation: IOpponentDerivation,
): GameState {
  const { entries } = input.proof;
  let { state, cursor, stepsTaken } = deriveOpponentTurn({
    state: initialState,
    opponentId: input.session.opponentId,
    entries,
    cursor: 0,
    derivation,
    applyAction: input.applyAction,
    stepsTaken: 0,
  });
  while (cursor < entries.length) {
    const entry = entries[cursor];
    cursor += 1;
    if (entry.action.type === "RESOLVE_REACTIVE_TRAP") {
      throw new CombatProofError("El journal declara una decisión de trampa fuera del turno del rival.");
    }
    state = input.applyAction(state, input.session.playerId, entry.action);
    ({ state, cursor, stepsTaken } = deriveOpponentTurn({
      state,
      opponentId: input.session.opponentId,
      entries,
      cursor,
      derivation,
      applyAction: input.applyAction,
      stepsTaken,
    }));
  }
  return state;
}

/**
 * Valida y reproduce la prueba completa; ganador y LP proceden exclusivamente del estado final.
 */
export function replayCombatProof(input: IReplayCombatProofInput): ICombatReplayResult {
  assertIdentity(input.session, input.proof);
  assertWindow(input.session, input.nowIso);
  assertJournal(
    input.proof,
    input.maxActions ?? DEFAULT_COMBAT_ACTION_LIMIT,
    input.maxProofBytes ?? DEFAULT_MAX_PROOF_BYTES,
  );
  input.proof.entries.forEach((entry) => {
    // Con rival derivado el journal es exclusivamente del jugador: declarar jugadas del rival era el
    // agujero que permitía enviar un combate donde la IA no jugaba nada.
    if (input.deriveOpponent && entry.actorPlayerId !== input.session.playerId) {
      throw new CombatProofError("El journal no puede declarar acciones del rival.");
    }
    if (entry.actorPlayerId !== input.session.playerId && entry.actorPlayerId !== input.session.opponentId) {
      throw new CombatProofError("Una acción pertenece a un actor ajeno a la sesión.");
    }
  });
  const initialState = input.initialStateFactory();
  assertStateParticipants(initialState, input.session);
  const finalState = input.deriveOpponent
    ? replayWithDerivedOpponent(input, initialState, input.deriveOpponent)
    : input.proof.entries.reduce(
      (state, entry) => input.applyAction(state, entry.actorPlayerId, entry.action),
      initialState,
    );
  const winnerPlayerId = resolveWinnerPlayerId(finalState);
  if (!winnerPlayerId) throw new CombatProofError("La prueba no concluye el duelo.");
  const player = finalState.playerA.id === input.session.playerId ? finalState.playerA : finalState.playerB;
  const opponent = finalState.playerA.id === input.session.opponentId ? finalState.playerA : finalState.playerB;
  // Impecable es "no recibir daño en ESTA batalla", no "acabar con los LP al máximo": en Supervivencia el
  // jugador arrastra los LP del combate anterior y comparar con el máximo lo hacía inalcanzable.
  const initialPlayer = initialState.playerA.id === input.session.playerId ? initialState.playerA : initialState.playerB;
  return {
    winnerPlayerId,
    playerEndingHealthPoints: player.healthPoints,
    opponentEndingHealthPoints: opponent.healthPoints,
    turn: finalState.turn,
    flawless: winnerPlayerId === player.id && player.healthPoints >= initialPlayer.healthPoints,
    finalState,
  };
}
