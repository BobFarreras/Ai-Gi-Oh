// src/core/use-cases/progression/GetSkillTreeStateUseCase.ts - Devuelve el estado del árbol para la UI (ficha
// 8): catálogo activo + rangos del jugador + nivel/puntos, resuelto a un modelo de lectura por nodo. El nivel y
// los puntos se derivan de la XP (server-authoritative); la UI solo pinta.
import { ValidationError } from "@/core/errors/ValidationError";
import { IPlayerProgressRepository } from "@/core/repositories/IPlayerProgressRepository";
import { ISkillTreeRepository } from "@/core/repositories/ISkillTreeRepository";
import { resolvePlayerLevel } from "@/core/services/progression/player-level";
import { ISkillTreeView, resolveSkillTreeView } from "@/core/services/progression/skill-tree/resolve-skill-tree-view";

export class GetSkillTreeStateUseCase {
  constructor(
    private readonly skillTreeRepository: ISkillTreeRepository,
    private readonly progressRepository: IPlayerProgressRepository,
  ) {}

  async execute(playerId: string): Promise<ISkillTreeView> {
    if (!playerId.trim()) throw new ValidationError("El identificador del jugador es obligatorio.");
    const [catalog, ranks, progress] = await Promise.all([
      this.skillTreeRepository.getActiveCatalog(),
      this.skillTreeRepository.getPlayerRanks(playerId),
      this.progressRepository.getByPlayerId(playerId),
    ]);
    const level = resolvePlayerLevel(progress?.playerExperience ?? 0);
    return resolveSkillTreeView(catalog, ranks, level);
  }
}
