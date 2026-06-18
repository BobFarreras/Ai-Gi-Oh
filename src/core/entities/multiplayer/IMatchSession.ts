// src/core/entities/multiplayer/IMatchSession.ts - Sesión de partida multijugador activa o pendiente.
export type MatchSessionStatus = "WAITING" | "ACTIVE" | "FINISHED" | "ABANDONED";

export interface IMatchSession {
  id: string;
  playerAId: string;
  playerBId: string;
  status: MatchSessionStatus;
  winnerId: string | null;
  deckAIds: string[];
  deckBIds: string[];
  startedAt: string | null;
  finishedAt: string | null;
  createdAt: string;
}
