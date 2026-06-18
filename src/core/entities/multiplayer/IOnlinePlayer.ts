// src/core/entities/multiplayer/IOnlinePlayer.ts - Presencia de jugador en el hub multijugador.
export type OnlinePlayerStatus = "IDLE" | "IN_LOBBY" | "IN_MATCH";

export interface IOnlinePlayer {
  playerId: string;
  nickname: string;
  status: OnlinePlayerStatus;
}
