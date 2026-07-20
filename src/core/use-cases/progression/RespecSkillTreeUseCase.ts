// src/core/use-cases/progression/RespecSkillTreeUseCase.ts - Reasignación total del árbol (ficha 8). Borra
// todos los rangos del jugador SI tiene la "llave" (nodo con efecto GRANT_RESPEC_TOKEN). No cuesta puntos ni
// Nexus (modelo A: gratis con llave); los puntos se recalculan solos desde el nivel. La RPC service-role valida
// la llave y aplica el borrado de forma atómica e idempotente. El cliente no aporta nada salvo el operationId.
import { ValidationError } from "@/core/errors/ValidationError";
import { IRespecResult } from "@/core/entities/progression/ISkillTreeNode";
import { ISkillTreeRepository } from "@/core/repositories/ISkillTreeRepository";

export interface IRespecSkillTreeInput {
  playerId: string;
  operationId: string;
}

export class RespecSkillTreeUseCase {
  constructor(private readonly skillTreeRepository: ISkillTreeRepository) {}

  async execute(input: IRespecSkillTreeInput): Promise<IRespecResult> {
    if (!input.playerId.trim()) throw new ValidationError("El identificador del jugador es obligatorio.");
    if (!input.operationId.trim()) throw new ValidationError("La operación de reasignación es obligatoria.");

    return this.skillTreeRepository.respec({ playerId: input.playerId, operationId: input.operationId });
  }
}
