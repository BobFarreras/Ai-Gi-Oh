// src/core/entities/player/IPlayerProfile.ts - Describe perfil principal del jugador persistido fuera del motor de combate.
export interface IPlayerProfile {
  playerId: string;
  nickname: string;
  avatarUrl: string | null;
  createdAtIso: string;
  updatedAtIso: string;
}
