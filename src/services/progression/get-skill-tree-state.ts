// src/services/progression/get-skill-tree-state.ts - Resuelve el estado del árbol de habilidades del Operador
// (ficha 8) para la página: cablea los repositorios Supabase con el use-case. No-fatal: si el árbol aún no está
// migrado o falla, devuelve null (la página se muestra vacía en vez de romper el hub).
import { ISkillTreeView } from "@/core/services/progression/skill-tree/resolve-skill-tree-view";
import { GetSkillTreeStateUseCase } from "@/core/use-cases/progression/GetSkillTreeStateUseCase";
import { SupabasePlayerProgressRepository } from "@/infrastructure/persistence/supabase/SupabasePlayerProgressRepository";
import { SupabaseSkillTreeRepository } from "@/infrastructure/persistence/supabase/SupabaseSkillTreeRepository";
import { createSupabaseServerClient } from "@/infrastructure/persistence/supabase/internal/create-supabase-server-client";
import { getCurrentUserSession } from "@/services/auth/get-current-user-session";

export async function getSkillTreeState(): Promise<ISkillTreeView | null> {
  const session = await getCurrentUserSession();
  if (!session?.user.id) return null;
  try {
    const client = await createSupabaseServerClient();
    return await new GetSkillTreeStateUseCase(
      new SupabaseSkillTreeRepository(client),
      new SupabasePlayerProgressRepository(client),
    ).execute(session.user.id);
  } catch {
    return null;
  }
}
