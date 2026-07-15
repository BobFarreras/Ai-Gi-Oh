// src/services/progression/get-player-card-upgrades.ts - Bonus de objetos de mejora (ATK/DEF) por carta del
// jugador de la sesión, como objeto plano listo para el arsenal (almacén + deck muestran stats reales).
import { ICardUpgradeBonuses } from "@/core/services/progression/card-upgrade-rules";
import { getCurrentUserSession } from "@/services/auth/get-current-user-session";
import { createSupabaseServerClient } from "@/infrastructure/persistence/supabase/internal/create-supabase-server-client";
import { SupabasePlayerCardUpgradesRepository } from "@/infrastructure/persistence/supabase/SupabasePlayerCardUpgradesRepository";

export async function getPlayerCardUpgrades(): Promise<Record<string, ICardUpgradeBonuses>> {
  const session = await getCurrentUserSession();
  if (!session?.user.id) return {};
  const client = await createSupabaseServerClient();
  const map = await new SupabasePlayerCardUpgradesRepository(client).getUpgradesByPlayer(session.user.id);
  return Object.fromEntries(map);
}
