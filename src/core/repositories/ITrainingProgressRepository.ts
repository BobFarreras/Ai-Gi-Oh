// src/core/repositories/ITrainingProgressRepository.ts - Contrato de persistencia del progreso de entrenamiento por jugador.
import { ITrainingProgress } from "@/core/entities/training/ITrainingProgress";

export interface ITrainingProgressRepository {
  getByPlayerId(playerId: string): Promise<ITrainingProgress | null>;
  upsert(progress: ITrainingProgress): Promise<ITrainingProgress>;
}
