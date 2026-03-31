// src/app/admin/page.tsx - Redirige a la URL real del portal admin solo cuando la sesión tiene permisos administrativos.
import { redirect } from "next/navigation";
import { AuthorizationError } from "@/core/errors/AuthorizationError";
import { assertAdminAccess } from "@/services/admin/assert-admin-access";
import { resolveAdminPortalSlug } from "@/services/admin/internal/resolve-admin-portal-slug";
import { getCurrentUserSession } from "@/services/auth/get-current-user-session";

export default async function AdminEntryPage() {
  const session = await getCurrentUserSession();
  if (!session) redirect("/login");
  try {
    await assertAdminAccess();
  } catch (error) {
    if (error instanceof AuthorizationError) redirect("/hub");
    throw error;
  }
  redirect(`/admin-portal/${resolveAdminPortalSlug()}`);
}
