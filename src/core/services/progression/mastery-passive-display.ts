// src/core/services/progression/mastery-passive-display.ts - Traduce identificadores de pasiva mastery a textos legibles en UI.
const PASSIVE_LABEL_BY_ID: Record<string, string> = {
  "passive-atk-drain-200": "Drenaje de ATK: al ser atacada, reduce 200 ATK del atacante.",
  "passive-defense-energy-plus-1": "Núcleo Defensivo: en defensa, gana +1 energía al inicio del turno.",
  "passive-attack-energy-plus-1": "Turbo Ofensivo: en ataque, gana +1 energía al inicio del turno.",
  "passive-direct-hit-plus-200": "Carga Letal: los golpes directos infligen +200 daño.",
};

export function resolveMasteryPassiveLabel(passiveSkillId: string | null): string | null {
  if (!passiveSkillId) return null;
  return PASSIVE_LABEL_BY_ID[passiveSkillId] ?? "Pasiva Mastery activa en esta carta.";
}
