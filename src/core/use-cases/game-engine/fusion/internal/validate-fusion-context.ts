// src/core/use-cases/game-engine/fusion/internal/validate-fusion-context.ts - Valida precondiciones y construye el contexto de resolución de una fusión.
import { BattleMode, IBoardEntity, IPlayer } from "@/core/entities/IPlayer";
import { GameRuleError } from "@/core/errors/GameRuleError";
import { NotFoundError } from "@/core/errors/NotFoundError";
import { ValidationError } from "@/core/errors/ValidationError";
import { assertFusionCardInFusionDeck } from "@/core/use-cases/game-engine/fusion/internal/assert-fusion-card-in-fusion-deck";
import { IFusionRecipe, getFusionRecipe } from "@/core/use-cases/game-engine/fusion/fusion-recipes";
import { IFusionContext } from "@/core/use-cases/game-engine/fusion/internal/fusion-types";
import { GameState } from "@/core/use-cases/game-engine/state/types";

const MAX_ENTITY_SLOTS = 3;

export function validateFusionPreconditions(state: GameState, playerId: string, mode: BattleMode): void {
  if (state.pendingTurnAction) throw new GameRuleError("Debes resolver la acción obligatoria antes de fusionar.");
  if (state.activePlayerId !== playerId) throw new GameRuleError("No es tu turno.");
  if (state.phase !== "MAIN_1") throw new GameRuleError("Solo puedes fusionar en MAIN_1.");
  if (mode !== "ATTACK" && mode !== "DEFENSE") throw new ValidationError("Modo inválido para invocación por fusión.");
}

export function createFusionContext(
  player: IPlayer,
  opponent: IPlayer,
  fusionCardId: string,
  materialIds: [string, string],
  mode: Extract<BattleMode, "ATTACK" | "DEFENSE">,
): IFusionContext {
  const fusionCard = player.hand.find((card) => card.runtimeId === fusionCardId || card.id === fusionCardId);
  if (!fusionCard) throw new NotFoundError("La carta de fusión no está en la mano.");
  if (fusionCard.type !== "FUSION") throw new ValidationError("La carta seleccionada no es de tipo fusión.");
  assertFusionCardInFusionDeck(player, fusionCard.id);
  if (materialIds[0] === materialIds[1]) throw new ValidationError("Debes seleccionar 2 materiales distintos para fusionar.");
  const materials = materialIds.map((instanceId) => {
    const entity = player.activeEntities.find((current) => current.instanceId === instanceId);
    if (!entity) throw new NotFoundError("Uno de los materiales no existe en tu campo.");
    return entity;
  }) as [IBoardEntity, IBoardEntity];
  const recipe = getFusionRecipe(fusionCard);
  if (!recipe) throw new ValidationError("La carta de fusión no tiene receta válida.");
  validateMaterialsAgainstRecipe(recipe, materials);
  validateFusionEnergy(player, fusionCard, materials, recipe.requiredTotalEnergy ?? null);
  const remainingSlots = player.activeEntities.length - materials.length + 1;
  if (remainingSlots > MAX_ENTITY_SLOTS) throw new GameRuleError("No hay espacio en el campo para invocar la fusión.");
  return { player, opponent, fusionCard, recipe, materials, mode };
}

function validateMaterialsAgainstRecipe(recipe: IFusionRecipe, materials: [IBoardEntity, IBoardEntity]): void {
  if (recipe.requiredMaterialIds) {
    const cardIds = materials.map((material) => material.card.id);
    const matches = recipe.requiredMaterialIds.every((requiredId) => cardIds.includes(requiredId));
    if (!matches) throw new ValidationError("Los materiales no cumplen la receta de fusión.");
  }
  if (recipe.requiredArchetypes) {
    const pending = [...recipe.requiredArchetypes];
    for (const material of materials) {
      const archetype = material.card.archetype;
      if (!archetype) continue;
      const index = pending.indexOf(archetype);
      if (index >= 0) pending.splice(index, 1);
    }
    if (pending.length > 0) throw new ValidationError("Los arquetipos de los materiales no cumplen la receta.");
  }
}

function validateFusionEnergy(
  player: IPlayer,
  fusionCard: { fusionEnergyRequirement?: number; cost: number },
  materials: [IBoardEntity, IBoardEntity],
  recipeTotalEnergy: number | null,
): void {
  void player;
  void fusionCard;
  void materials;
  void recipeTotalEnergy;
}
