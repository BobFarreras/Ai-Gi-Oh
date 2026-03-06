// src/core/repositories/IPlayerCardProgressRepository.ts - Contrato para persistencia de progresión por carta de cada jugador.
import { IPlayerCardProgress } from "@/core/entities/progression/IPlayerCardProgress";

export interface IUpsertPlayerCardProgressInput {
  playerId: string;
  cardId: string;
  versionTier?: number;
  level?: number;
  xp?: number;
  masteryPassiveSkillId?: string | null;
}

export interface IPlayerCardProgressRepository {
  getByPlayerAndCard(playerId: string, cardId: string): Promise<IPlayerCardProgress | null>;
  listByPlayer(playerId: string): Promise<IPlayerCardProgress[]>;
  upsert(input: IUpsertPlayerCardProgressInput): Promise<IPlayerCardProgress>;
}
