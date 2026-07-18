// src/core/services/progression/skill-tree/resolve-player-skill-modifiers.ts - Resolver PURO del árbol de
// habilidades (ficha 8): recibe los nodos desbloqueados con su rango y devuelve los modificadores agregados,
// sumando `efecto·rango`. Única fuente de la agregación; los consumidores (servidor de recompensa, builder de
// partida PvE, UIs de feature) leen el struct, nunca los nodos a mano.
import { IPlayerSkillModifiers, IPlayerSkillNodeState } from "./skill-effect-types";

function createEmptyModifiers(): IPlayerSkillModifiers {
  return {
    economy: {
      nexusRewardMult: 0,
      xpRewardMult: 0,
      lossConsolationMult: 0,
      firstWinDoubleNexus: false,
      passiveNexusPerWinBonus: 0,
      passiveNexusDailyBonus: 0,
    },
    combat: {
      startingLpBonus: 0,
      maxEnergyBonus: 0,
      turn1EnergyBonus: 0,
      openingHandBonus: 0,
      openingMulligan: false,
      editOpeningDeckCount: 0,
    },
    permissions: {
      secondDeckSlot: false,
      respecTokens: 0,
    },
  };
}

/**
 * Agrega los efectos de los nodos que el jugador tiene desbloqueados. Los escalables multiplican por el
 * rango; los keystone (valor fijo/booleano) aportan una vez. Un nodo sin rango válido (< 1) se ignora.
 * `kind`s desconocidos (catálogo de BD más nuevo que el código) se ignoran sin romper — compat hacia delante.
 */
export function resolvePlayerSkillModifiers(nodes: readonly IPlayerSkillNodeState[]): IPlayerSkillModifiers {
  const mods = createEmptyModifiers();

  for (const { effect, rank } of nodes) {
    if (!Number.isFinite(rank) || rank < 1) continue;

    switch (effect.kind) {
      // — Economía —
      case "NEXUS_REWARD_MULT":
        mods.economy.nexusRewardMult += effect.valuePerRank * rank;
        break;
      case "XP_REWARD_MULT":
        mods.economy.xpRewardMult += effect.valuePerRank * rank;
        break;
      case "LOSS_CONSOLATION_MULT":
        mods.economy.lossConsolationMult += effect.valuePerRank * rank;
        break;
      case "PASSIVE_NEXUS_CAP_BONUS":
        mods.economy.passiveNexusPerWinBonus += (effect.perWinPerRank ?? 0) * rank;
        mods.economy.passiveNexusDailyBonus += (effect.dailyPerRank ?? 0) * rank;
        break;
      case "FIRST_WIN_DOUBLE_NEXUS":
        mods.economy.firstWinDoubleNexus = true;
        break;
      // — Combate —
      case "STARTING_LP_BONUS":
        mods.combat.startingLpBonus += effect.valuePerRank * rank;
        break;
      case "MAX_ENERGY_BONUS":
        mods.combat.maxEnergyBonus += effect.valuePerRank * rank;
        break;
      case "TURN1_ENERGY_BONUS":
        mods.combat.turn1EnergyBonus += effect.value;
        break;
      case "OPENING_HAND_BONUS":
        mods.combat.openingHandBonus += effect.value;
        break;
      case "OPENING_MULLIGAN":
        mods.combat.openingMulligan = true;
        break;
      case "EDIT_OPENING_DECK":
        mods.combat.editOpeningDeckCount = Math.max(mods.combat.editOpeningDeckCount, effect.count);
        break;
      // — Permisos —
      case "UNLOCK_SECOND_DECK":
        mods.permissions.secondDeckSlot = true;
        break;
      case "GRANT_RESPEC_TOKEN":
        mods.permissions.respecTokens += effect.value;
        break;
      default:
        // kind desconocido: se ignora (catálogo más nuevo que el código).
        break;
    }
  }

  return mods;
}
