// src/core/repositories/IOpponentRepository.ts - Contrato de acceso a oponentes/duelos de historia para desacoplar BD de la UI del combate.
import { IStoryDuelDefinition } from "@/core/entities/opponent/IStoryDuelDefinition";
import { IStoryDuelSummary } from "@/core/entities/opponent/IStoryDuelSummary";

export interface IOpponentRepository {
  listStoryDuels: () => Promise<IStoryDuelSummary[]>;
  getStoryDuel: (chapter: number, duelIndex: number) => Promise<IStoryDuelDefinition | null>;
}
