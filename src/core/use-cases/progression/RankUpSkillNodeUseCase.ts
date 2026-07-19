// src/core/use-cases/progression/RankUpSkillNodeUseCase.ts - Orquesta la subida de un rango del árbol de
// habilidades (ficha 8). Es el TRUST BOUNDARY de los puntos: el servidor deriva los puntos disponibles de la
// XP BLINDADA (`playerExperience`, ya server-authoritative tras la migración 135) con la curva ÚNICA de
// `resolvePlayerLevel`, y se los pasa al repositorio → la RPC valida el gasto atómicamente. El cliente nunca
// aporta ni la XP ni los puntos.
import { ValidationError } from "@/core/errors/ValidationError";
import { IRankUpResult } from "@/core/entities/progression/ISkillTreeNode";
import { IPlayerProgressRepository } from "@/core/repositories/IPlayerProgressRepository";
import { ISkillTreeRepository } from "@/core/repositories/ISkillTreeRepository";
import { resolvePlayerLevel } from "@/core/services/progression/player-level";

export interface IRankUpSkillNodeInput {
  playerId: string;
  nodeId: string;
  operationId: string;
}

export class RankUpSkillNodeUseCase {
  constructor(
    private readonly skillTreeRepository: ISkillTreeRepository,
    private readonly progressRepository: IPlayerProgressRepository,
  ) {}

  async execute(input: IRankUpSkillNodeInput): Promise<IRankUpResult> {
    if (!input.playerId.trim()) throw new ValidationError("El identificador del jugador es obligatorio.");
    if (!input.nodeId.trim()) throw new ValidationError("El identificador del nodo es obligatorio.");
    if (!input.operationId.trim()) throw new ValidationError("La operación de subida es obligatoria.");

    // Los puntos disponibles se DERIVAN de la XP del servidor (nunca del cliente). Sin progreso → 0 XP → 0 pts.
    const progress = await this.progressRepository.getByPlayerId(input.playerId);
    const experience = progress?.playerExperience ?? 0;
    const availablePoints = resolvePlayerLevel(experience).totalSkillPoints;

    return this.skillTreeRepository.rankUp({
      playerId: input.playerId,
      nodeId: input.nodeId,
      availablePoints,
      operationId: input.operationId,
    });
  }
}
