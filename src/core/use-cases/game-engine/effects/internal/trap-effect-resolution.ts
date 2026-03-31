// src/core/use-cases/game-engine/effects/internal/trap-effect-resolution.ts - Resuelve efectos de trampa a través de registry tipado para facilitar extensiones.
import { IBoardEntity, IPlayer } from "@/core/entities/IPlayer";
import { resolveTrapEffectFromRegistry } from "@/core/use-cases/game-engine/effects/internal/trap-effect-registry";
import { ITrapResolutionResult, ITrapTriggerContext } from "@/core/use-cases/game-engine/effects/internal/trap-types";

function createNeutralResult(player: IPlayer, opponent: IPlayer): ITrapResolutionResult {
  return {
    player,
    opponent,
    damage: 0,
    buffTargetEntityIds: [],
    buffStat: null,
    buffAmount: 0,
    blockedTargetEntityInstanceId: null,
    destroyedOpponentEntityCardId: null,
    destroyedOpponentEntityInstanceId: null,
    destroyedOpponentEntitySlotIndex: null,
    destroyedOpponentEntityDestination: null,
  };
}

export function resolveTrapEffect(player: IPlayer, opponent: IPlayer, trap: IBoardEntity, context?: ITrapTriggerContext): ITrapResolutionResult {
  return resolveTrapEffectFromRegistry(player, opponent, trap, context) ?? createNeutralResult(player, opponent);
}
