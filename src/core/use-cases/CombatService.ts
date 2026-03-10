// src/core/use-cases/CombatService.ts - Descripción breve del módulo.
export interface CombatContext {
  attackerAtk: number;
  defenderStat: number; // Será el ATK si está en ataque, o DEF si está en defensa
  isDefenderInDefenseMode: boolean;
}

export interface CombatResult {
  damageToAttackerPlayer: number;
  damageToDefenderPlayer: number;
  attackerDestroyed: boolean;
  defenderDestroyed: boolean;
}

export class CombatService {
  
  /**
   * Calcula el resultado de un ataque directo al jugador.
   */
  public static calculateDirectAttack(ctx: { attackerAtk: number }): CombatResult {
    return {
      damageToAttackerPlayer: 0,
      damageToDefenderPlayer: ctx.attackerAtk,
      attackerDestroyed: false,
      defenderDestroyed: false,
    };
  }

  /**
   * Calcula el resultado de una batalla entre dos entidades.
   */
  public static calculateBattle(ctx: CombatContext): CombatResult {
    const { attackerAtk, defenderStat, isDefenderInDefenseMode } = ctx;

    const result: CombatResult = {
      damageToAttackerPlayer: 0,
      damageToDefenderPlayer: 0,
      attackerDestroyed: false,
      defenderDestroyed: false,
    };

    if (!isDefenderInDefenseMode) {
      // BATALLA: ATAQUE VS ATAQUE
      if (attackerAtk > defenderStat) {
        result.defenderDestroyed = true;
        result.damageToDefenderPlayer = attackerAtk - defenderStat;
      } else if (attackerAtk < defenderStat) {
        result.attackerDestroyed = true;
        result.damageToAttackerPlayer = defenderStat - attackerAtk;
      } else {
        // Empate
        result.attackerDestroyed = true;
        result.defenderDestroyed = true;
      }
    } else {
      // BATALLA: ATAQUE VS DEFENSA
      if (attackerAtk > defenderStat) {
        // Rompe la defensa, pero no hay daño penetrante al jugador (regla clásica)
        result.defenderDestroyed = true;
      } else if (attackerAtk < defenderStat) {
        // Rebote: El atacante choca contra un muro duro y se hace daño, pero no muere
        result.damageToAttackerPlayer = defenderStat - attackerAtk;
      }
      // Si hay empate (ATK == DEF), no pasa nada
    }

    return result;
  }
}
