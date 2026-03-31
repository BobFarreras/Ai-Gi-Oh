// e2e/support/supabase-admin-cleanup.ts - Limpia usuarios efímeros E2E mediante Admin API de Supabase para evitar contaminación de cuentas.
import { createClient } from "@supabase/supabase-js";

function resolveAdminEnv(): { url: string; serviceRoleKey: string } | null {
  const url = process.env.E2E_SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.E2E_SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) return null;
  return { url, serviceRoleKey };
}

/**
 * Borra usuario por email tras onboarding E2E para no acumular cuentas de test.
 */
export async function deleteSupabaseUserByEmail(email: string): Promise<"deleted" | "not_found" | "skipped"> {
  const env = resolveAdminEnv();
  if (!env) return "skipped";
  const adminClient = createClient(env.url, env.serviceRoleKey, { auth: { persistSession: false } });
  const { data, error } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) throw new Error(`No se pudo listar usuarios en limpieza E2E: ${error.message}`);
  const targetUser = data.users.find((user) => user.email?.toLowerCase() === email.toLowerCase());
  if (!targetUser) return "not_found";
  const { error: deleteError } = await adminClient.auth.admin.deleteUser(targetUser.id);
  if (deleteError) throw new Error(`No se pudo borrar usuario efímero E2E: ${deleteError.message}`);
  return "deleted";
}
