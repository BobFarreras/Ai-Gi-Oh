// src/app/admin-portal/[portalSlug]/layout.tsx - Protege el acceso al portal admin validando slug esperado y permisos administrativos.
import { ReactNode } from "react";
import { notFound, redirect } from "next/navigation";
import { AuthorizationError } from "@/core/errors/AuthorizationError";
import { assertAdminAccess } from "@/services/admin/assert-admin-access";
import { resolveAdminPortalSlug } from "@/services/admin/internal/resolve-admin-portal-slug";
import { getCurrentUserSession } from "@/services/auth/get-current-user-session";

interface AdminPortalLayoutProps {
  children: ReactNode;
  params: Promise<{ portalSlug: string }>;
}

export default async function AdminPortalLayout({ children, params }: AdminPortalLayoutProps) {
  const session = await getCurrentUserSession();
  if (!session) redirect("/login");
  const resolvedParams = await params;
  if (resolvedParams.portalSlug !== resolveAdminPortalSlug()) {
    notFound();
  }
  try {
    await assertAdminAccess();
  } catch (error) {
    if (!(error instanceof AuthorizationError)) throw error;
    notFound();
  }
  return children;
}
