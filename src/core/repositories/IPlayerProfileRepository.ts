// src/core/repositories/IPlayerProfileRepository.ts - Contrato para lectura y actualización del perfil de jugador.
import { IPlayerProfile } from "@/core/entities/player/IPlayerProfile";

export interface IUpdatePlayerProfileInput {
  playerId: string;
  nickname?: string;
  avatarUrl?: string | null;
}

export interface IPlayerProfileRepository {
  getByPlayerId(playerId: string): Promise<IPlayerProfile | null>;
  create(profile: IPlayerProfile): Promise<IPlayerProfile>;
  update(input: IUpdatePlayerProfileInput): Promise<IPlayerProfile>;
}
