// src/core/use-cases/game-engine/combat/internal/attack-resolution.ts - Resuelve estado de combate directo/entre entidades aplicando reglas y pasivas mastery.
import { IBoardEntity, IPlayer } from "@/core/entities/IPlayer";
import { NotFoundError } from "@/core/errors/NotFoundError";
import { CombatContext, CombatService } from "@/core/use-cases/CombatService";
import { assignPlayers } from "@/core/use-cases/game-engine/state/player-utils";
import { GameState } from "@/core/use-cases/game-engine/state/types";
import { markAttackerAsUsed } from "@/core/use-cases/game-engine/combat/internal/attack-entities";
import { validateDirectAttack } from "@/core/use-cases/game-engine/combat/internal/attack-validation";
import {
  applyAttackDrainByDefenderPassive,
  resolveDefenderReflectDamage,
  resolveDirectHitBonus,
  resolveEntityAttackBonus,
} from "@/core/use-cases/game-engine/combat/internal/attack-passives";
import { buildUpdatedAttacker, buildUpdatedDefender } from "@/core/use-cases/game-engine/combat/internal/attack-player-updates";

interface IResolveDirectAttackParams {
  state: GameState;
  attacker: IPlayer;
  defender: IPlayer;
  attackerEntity: IBoardEntity;
  attackerInstanceId: string;
  isPlayerA: boolean;
}

export function resolveDirectAttackState(params: IResolveDirectAttackParams): { state: GameState; damage: number } {
  const { state, attacker, defender, attackerEntity, attackerInstanceId, isPlayerA } = params;
  validateDirectAttack(defender.activeEntities.length > 0);
  const damage = (attackerEntity.card.attack ?? 0) + resolveDirectHitBonus(attackerEntity);
  const updatedAttacker: IPlayer = {
    ...attacker,
    activeEntities: markAttackerAsUsed(attacker.activeEntities, attackerInstanceId),
  };
  const updatedDefender: IPlayer = {
    ...defender,
    healthPoints: Math.max(0, defender.healthPoints - damage),
  };
  return { state: assignPlayers(state, updatedAttacker, updatedDefender, isPlayerA), damage };
}

interface IResolveEntityBattleParams {
  state: GameState;
  attacker: IPlayer;
  defender: IPlayer;
  attackerEntity: IBoardEntity;
  defenderInstanceId: string;
  attackerInstanceId: string;
  isPlayerA: boolean;
}

interface IResolvedEntityBattleResult extends ReturnType<typeof CombatService.calculateBattle> {
  passiveAttackReduction: number;
  /** Cortafuegos Reactivo: daño reflejado al jugador atacante (aparte del daño de combate). */
  reflectDamageToAttackerPlayer: number;
  attackerDestroyedDestination: "GRAVEYARD" | "DESTROYED" | null;
  defenderDestroyedDestination: "GRAVEYARD" | "DESTROYED" | null;
}

export function resolveEntityBattleState(params: IResolveEntityBattleParams): { state: GameState; result: IResolvedEntityBattleResult; defenderEntity: IBoardEntity } {
  const { state, attacker, defender, attackerEntity, defenderInstanceId, attackerInstanceId, isPlayerA } = params;
  const defenderEntity = defender.activeEntities.find((entity) => entity.instanceId === defenderInstanceId);
  if (!defenderEntity) {
    throw new NotFoundError("La carta defensora no está en el campo");
  }

  const isDefenderInDefenseMode = defenderEntity.mode === "DEFENSE" || defenderEntity.mode === "SET";
  // Sobrecarga: el bonus de ATK es efímero (solo este ataque); no se persiste en la carta.
  const attackerAttackBase = (attackerEntity.card.attack ?? 0) + resolveEntityAttackBonus(attackerEntity);
  const attackerAttackAfterPassive = applyAttackDrainByDefenderPassive(attackerAttackBase, defenderEntity);
  const passiveAttackReduction = Math.max(0, attackerAttackBase - attackerAttackAfterPassive);
  const defenderStat = isDefenderInDefenseMode ? (defenderEntity.card.defense ?? 0) : (defenderEntity.card.attack ?? 0);
  const context: CombatContext = {
    attackerAtk: attackerAttackAfterPassive,
    defenderStat,
    isDefenderInDefenseMode,
  };
  const result = CombatService.calculateBattle(context);
  // Cortafuegos Reactivo: el defensor refleja daño directo al jugador atacante, además del resultado del combate.
  const reflectDamage = resolveDefenderReflectDamage(defenderEntity);
  const updatedAttacker = buildUpdatedAttacker(
    attacker,
    attackerEntity,
    defenderEntity,
    attackerInstanceId,
    passiveAttackReduction,
    result.attackerDestroyed,
    result.damageToAttackerPlayer + reflectDamage,
    result.defenderDestroyed,
  );
  const updatedDefender = buildUpdatedDefender(
    defender,
    defenderEntity,
    attackerEntity,
    defenderInstanceId,
    result.defenderDestroyed,
    result.damageToDefenderPlayer,
    result.attackerDestroyed,
  );
  return {
    state: assignPlayers(state, updatedAttacker.player, updatedDefender.player, isPlayerA),
    result: {
      ...result,
      passiveAttackReduction,
      reflectDamageToAttackerPlayer: reflectDamage,
      attackerDestroyedDestination: updatedAttacker.destroyedDestination,
      defenderDestroyedDestination: updatedDefender.destroyedDestination,
    },
    defenderEntity,
  };
}
