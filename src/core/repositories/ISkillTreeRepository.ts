// src/core/repositories/ISkillTreeRepository.ts - Contrato de lectura del árbol de habilidades y de subida de
// rango. La subida NO recibe los puntos del cliente: el servidor (use-case) los deriva de la XP blindada y los
// pasa aquí; el repositorio los reenvía a la RPC service-role que valida atómicamente.
import { IPlayerSkillRank, IRankUpResult, IRespecResult, ISkillTreeNode } from "@/core/entities/progression/ISkillTreeNode";

export interface IRankUpSkillNodeCommand {
  playerId: string;
  nodeId: string;
  /** Puntos de habilidad disponibles, calculados por el servidor desde `playerExperience`. */
  availablePoints: number;
  /** Clave de idempotencia (una por intento de subida). */
  operationId: string;
}

export interface IRespecSkillTreeCommand {
  playerId: string;
  /** Clave de idempotencia (una por intento de reasignación). */
  operationId: string;
}

export interface ISkillTreeRepository {
  /** Nodos activos del catálogo (los `is_active=false` no se sirven). */
  getActiveCatalog(): Promise<ISkillTreeNode[]>;
  /** Rangos que el jugador tiene desbloqueados. */
  getPlayerRanks(playerId: string): Promise<IPlayerSkillRank[]>;
  /** Sube 1 rango vía RPC service-role (idempotente, valida gate/tope/puntos). */
  rankUp(command: IRankUpSkillNodeCommand): Promise<IRankUpResult>;
  /** Reasigna: borra todos los rangos vía RPC service-role si el jugador tiene la llave (idempotente). */
  respec(command: IRespecSkillTreeCommand): Promise<IRespecResult>;
}
