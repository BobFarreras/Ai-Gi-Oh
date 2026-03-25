// src/app/admin-portal/[portalSlug]/layout.tsx - Protege el acceso al portal admin validando slug esperado y permisos administrativos.
import { ReactNode } from "react";
import { notFound, redirect } from "next/navigation";
import { AuthorizationError } from "@/core/errors/AuthorizationError";
import { AdminSidebarNav } from "@/components/admin/AdminSidebarNav";
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
  return (
    <main className="min-h-dvh bg-slate-950 px-3 py-3 text-slate-100 md:px-4">
      <section className="mx-auto flex h-[calc(100dvh-1.5rem)] w-full min-h-0 gap-3">
        <AdminSidebarNav portalSlug={resolvedParams.portalSlug} />
        <div className="min-h-0 flex-1 rounded-xl border border-slate-700 bg-slate-900/70 p-3 md:p-4">{children}</div>
      </section>
    </main>
  );
}
