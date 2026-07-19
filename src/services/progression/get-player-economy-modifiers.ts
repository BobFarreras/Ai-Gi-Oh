// src/services/progression/get-player-economy-modifiers.ts - Modificadores de ECONOMÍA del árbol de habilidades
// (ficha 8) del jugador actual, para escalar las recompensas de duelo en el cierre (Nexus/XP, consuelo). Es la
// familia SEGURA en todos los modos (incluido multi): solo cambia "cuánto ganas", no altera el combate.
// No-fatal: sin sesión o si el árbol no está disponible, devuelve ceros (recompensa base sin escalar).
import { GetPlayerSkillModifiersUseCase } from "@/core/use-cases/progression/GetPlayerSkillModifiersUseCase";
import { IPlayerSkillModifiers } from "@/core/services/progression/skill-tree/skill-effect-types";
import { SupabaseSkillTreeRepository } from "@/infrastructure/persistence/supabase/SupabaseSkillTreeRepository";
import { createSupabaseServerClient } from "@/infrastructure/persistence/supabase/internal/create-supabase-server-client";
import { getCurrentUserSession } from "@/services/auth/get-current-user-session";

type EconomyModifiers = IPlayerSkillModifiers["economy"];

const EMPTY: EconomyModifiers = {
  nexusRewardMult: 0, xpRewardMult: 0, lossConsolationMult: 0, firstWinDoubleNexus: false,
  passiveNexusPerWinBonus: 0, passiveNexusDailyBonus: 0,
};

export async function getPlayerEconomyModifiers(): Promise<EconomyModifiers> {
  const session = await getCurrentUserSession();
  if (!session?.user.id) return EMPTY;
  try {
    const client = await createSupabaseServerClient();
    const modifiers = await new GetPlayerSkillModifiersUseCase(new SupabaseSkillTreeRepository(client)).execute(session.user.id);
    return modifiers.economy;
  } catch {
    return EMPTY;
  }
}
