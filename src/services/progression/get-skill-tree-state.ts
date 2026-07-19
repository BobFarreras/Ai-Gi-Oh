// src/services/progression/get-skill-tree-state.ts - Resuelve el estado del árbol de habilidades del Operador
// (ficha 8) para la página: cablea los repositorios Supabase con el use-case. No-fatal: si el árbol aún no está
// migrado o falla, devuelve tree=null (la página lo distingue de "no hay sesión" para no mentir en el mensaje).
import { ISkillTreeView } from "@/core/services/progression/skill-tree/resolve-skill-tree-view";
import { GetSkillTreeStateUseCase } from "@/core/use-cases/progression/GetSkillTreeStateUseCase";
import { SupabasePlayerProgressRepository } from "@/infrastructure/persistence/supabase/SupabasePlayerProgressRepository";
import { SupabaseSkillTreeRepository } from "@/infrastructure/persistence/supabase/SupabaseSkillTreeRepository";
import { createSupabaseServerClient } from "@/infrastructure/persistence/supabase/internal/create-supabase-server-client";
import { getCurrentUserSession } from "@/services/auth/get-current-user-session";

export interface ISkillTreeStateResult {
  authenticated: boolean;
  /** null cuando no hay sesión o cuando la carga falla (p.ej. tablas del árbol aún sin migrar). */
  tree: ISkillTreeView | null;
}

export async function getSkillTreeState(): Promise<ISkillTreeStateResult> {
  const session = await getCurrentUserSession();
  if (!session?.user.id) return { authenticated: false, tree: null };
  try {
    const client = await createSupabaseServerClient();
    const tree = await new GetSkillTreeStateUseCase(
      new SupabaseSkillTreeRepository(client),
      new SupabasePlayerProgressRepository(client),
    ).execute(session.user.id);
    return { authenticated: true, tree };
  } catch {
    return { authenticated: true, tree: null };
  }
}
