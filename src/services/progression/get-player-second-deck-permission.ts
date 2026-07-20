// src/services/progression/get-player-second-deck-permission.ts - ¿El jugador tiene desbloqueado el 2º mazo
// (Doble Arsenal, ficha 8)? Lee el permiso `secondDeckSlot` de los modificadores del árbol. No-fatal: sin
// sesión o si el árbol no está disponible, devuelve false (el arsenal muestra un solo mazo). La RPC de swap
// re-valida la llave server-side (esto es solo para pintar/activar la UI del switcher).
import { GetPlayerSkillModifiersUseCase } from "@/core/use-cases/progression/GetPlayerSkillModifiersUseCase";
import { SupabaseSkillTreeRepository } from "@/infrastructure/persistence/supabase/SupabaseSkillTreeRepository";
import { createSupabaseServerClient } from "@/infrastructure/persistence/supabase/internal/create-supabase-server-client";
import { getCurrentUserSession } from "@/services/auth/get-current-user-session";

export async function getPlayerHasSecondDeck(): Promise<boolean> {
  const session = await getCurrentUserSession();
  if (!session?.user.id) return false;
  try {
    const client = await createSupabaseServerClient();
    const modifiers = await new GetPlayerSkillModifiersUseCase(new SupabaseSkillTreeRepository(client)).execute(session.user.id);
    return modifiers.permissions.secondDeckSlot;
  } catch {
    return false;
  }
}
