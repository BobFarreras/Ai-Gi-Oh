// src/core/repositories/IOpponentSkillRepository.ts - Puerto de persistencia de las habilidades de combate
// asignadas a oponentes (Arena/Story). La escritura la hace el admin server-side (service-role); la lectura la
// usa el runtime de combate para cargar los modificadores del rival.
import { IOpponentSkillRank, OpponentSkillTargetType } from "@/core/entities/progression/IOpponentSkillRank";

export interface IOpponentSkillRepository {
  /** Habilidades asignadas a un oponente concreto. */
  getOpponentRanks(opponentId: string, opponentType: OpponentSkillTargetType): Promise<IOpponentSkillRank[]>;

  /** Asigna o actualiza (upsert) el rango de un nodo para un oponente. */
  setOpponentRank(opponentId: string, opponentType: OpponentSkillTargetType, nodeId: string, rank: number): Promise<void>;

  /** Quita una habilidad asignada a un oponente. */
  removeOpponentRank(opponentId: string, opponentType: OpponentSkillTargetType, nodeId: string): Promise<void>;
}
