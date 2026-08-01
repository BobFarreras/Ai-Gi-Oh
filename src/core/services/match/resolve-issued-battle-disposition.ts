// src/core/services/match/resolve-issued-battle-disposition.ts - Decide si una batalla pendiente se reanuda, se castiga por abandono o se reemite.
import { GameState } from "@/core/use-cases/GameEngine";

export type IssuedBattleDisposition = "RESUME" | "FORFEIT" | "REISSUE";

interface IResolveIssuedBattleDispositionInput {
  session: { protocolVersion: number; expiresAtIso: string } | null;
  snapshot: GameState | null;
  nowIso: string;
  expectedProtocolVersion: number;
}

/** Un snapshot anterior al contrato PvE de cuatro cartas no es jugable y nunca debe castigarse. */
function hasCurrentOpeningContract(snapshot: GameState | null): boolean {
  return Boolean(
    snapshot
    && Array.isArray(snapshot.playerA?.hand)
    && snapshot.playerA.hand.length === 4
    && Array.isArray(snapshot.playerB?.hand)
    && snapshot.playerB.hand.length === 4,
  );
}

/**
 * La incompatibilidad siempre gana sobre la caducidad: solo se castiga al jugador por abandonar un
 * combate que realmente podía jugar, nunca por una migración nuestra que dejó su snapshot inservible.
 */
export function resolveIssuedBattleDisposition(input: IResolveIssuedBattleDispositionInput): IssuedBattleDisposition {
  if (!input.session || !input.snapshot) return "REISSUE";
  if (input.session.protocolVersion !== input.expectedProtocolVersion) return "REISSUE";
  if (!hasCurrentOpeningContract(input.snapshot)) return "REISSUE";
  const nowMs = Date.parse(input.nowIso);
  const expiresAtMs = Date.parse(input.session.expiresAtIso);
  if (!Number.isFinite(nowMs) || !Number.isFinite(expiresAtMs)) return "REISSUE";
  return expiresAtMs > nowMs ? "RESUME" : "FORFEIT";
}
