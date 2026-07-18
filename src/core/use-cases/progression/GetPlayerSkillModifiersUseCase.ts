// src/core/use-cases/progression/GetPlayerSkillModifiersUseCase.ts - Devuelve los modificadores agregados del
// árbol de un jugador (ficha 8). Es la fuente que consumen el cierre de duelo (economía) y, más adelante, la
// preparación de partida (combate). Lee el catálogo ACTIVO + los rangos del jugador y agrega.
import { ValidationError } from "@/core/errors/ValidationError";
import { ISkillTreeRepository } from "@/core/repositories/ISkillTreeRepository";
import { resolveModifiersFromCatalog } from "@/core/services/progression/skill-tree/resolve-modifiers-from-catalog";
import { IPlayerSkillModifiers } from "@/core/services/progression/skill-tree/skill-effect-types";

export class GetPlayerSkillModifiersUseCase {
  constructor(private readonly skillTreeRepository: ISkillTreeRepository) {}

  async execute(playerId: string): Promise<IPlayerSkillModifiers> {
    if (!playerId.trim()) throw new ValidationError("El identificador del jugador es obligatorio.");
    const [catalog, ranks] = await Promise.all([
      this.skillTreeRepository.getActiveCatalog(),
      this.skillTreeRepository.getPlayerRanks(playerId),
    ]);
    return resolveModifiersFromCatalog(catalog, ranks);
  }
}
