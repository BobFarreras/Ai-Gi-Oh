// src/services/progression/get-player-combat-modifiers.ts - Modificadores de COMBATE del árbol de habilidades
// (ficha 8) del jugador actual, para aplicarlos en la preparación de partidas PvE (Story/Arena). No-fatal: si
// no hay sesión o el árbol no está disponible, devuelve ceros (el combate arranca con los valores por defecto).
import { GetPlayerSkillModifiersUseCase } from "@/core/use-cases/progression/GetPlayerSkillModifiersUseCase";
import { SupabaseSkillTreeRepository } from "@/infrastructure/persistence/supabase/SupabaseSkillTreeRepository";
import { createSupabaseServerClient } from "@/infrastructure/persistence/supabase/internal/create-supabase-server-client";
import { getCurrentUserSession } from "@/services/auth/get-current-user-session";

export interface IPlayerCombatModifiers {
  startingLpBonus: number;
  maxEnergyBonus: number;
  turn1EnergyBonus: number;
  openingHandBonus: number;
}

const EMPTY: IPlayerCombatModifiers = { startingLpBonus: 0, maxEnergyBonus: 0, turn1EnergyBonus: 0, openingHandBonus: 0 };

export async function getPlayerCombatModifiers(): Promise<IPlayerCombatModifiers> {
  const session = await getCurrentUserSession();
  if (!session?.user.id) return EMPTY;
  try {
    const client = await createSupabaseServerClient();
    const modifiers = await new GetPlayerSkillModifiersUseCase(new SupabaseSkillTreeRepository(client)).execute(session.user.id);
    return {
      startingLpBonus: modifiers.combat.startingLpBonus,
      maxEnergyBonus: modifiers.combat.maxEnergyBonus,
      turn1EnergyBonus: modifiers.combat.turn1EnergyBonus,
      openingHandBonus: modifiers.combat.openingHandBonus,
    };
  } catch {
    return EMPTY;
  }
}
