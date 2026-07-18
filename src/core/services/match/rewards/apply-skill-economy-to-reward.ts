// src/core/services/match/rewards/apply-skill-economy-to-reward.ts - Aplica los modificadores de ECONOMÍA del
// árbol de habilidades (ficha 8) sobre la recompensa base de un duelo. Función PURA: el servidor la usa en el
// cierre (donde ya se acreditan Nexus/XP), nunca el cliente. Solo toca la recompensa del duelo; los topes de la
// pasiva de Recaudación se ajustan aparte (se pasan a credit_passive_nexus).
import { IMatchOutcome } from "@/core/entities/match/IMatchOutcome";
import { IMatchReward } from "@/core/entities/match/IMatchReward";
import { IPlayerSkillModifiers } from "@/core/services/progression/skill-tree/skill-effect-types";

export interface IApplySkillEconomyInput {
  base: IMatchReward;
  economy: IPlayerSkillModifiers["economy"];
  outcome: IMatchOutcome;
  /** El servidor decide si es la 1ª victoria del día (contador server-side); habilita el ×2 de Nexus. */
  isFirstWinOfDay?: boolean;
}

/** Ignora multiplicadores negativos por robustez (un dato corrupto no puede REDUCIR la recompensa base). */
function positiveMult(value: number): number {
  return 1 + Math.max(0, Number.isFinite(value) ? value : 0);
}

export function applySkillEconomyToReward(input: IApplySkillEconomyInput): IMatchReward {
  const { base, economy, outcome } = input;

  let nexus = base.nexus * positiveMult(economy.nexusRewardMult);
  const experience = base.playerExperience * positiveMult(economy.xpRewardMult);

  // Consuelo: solo al PERDER, suaviza el castigo sumando un % del Nexus de derrota.
  if (outcome === "LOSE") nexus *= positiveMult(economy.lossConsolationMult);

  // Golpe de Suerte: la 1ª victoria del día dobla el Nexus del duelo (keystone).
  if (outcome === "WIN" && input.isFirstWinOfDay === true && economy.firstWinDoubleNexus) nexus *= 2;

  return { nexus: Math.floor(nexus), playerExperience: Math.floor(experience) };
}
