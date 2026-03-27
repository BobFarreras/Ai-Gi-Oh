// src/app/admin-portal/[portalSlug]/audit/page.tsx - Renderiza visor read-only de auditoría administrativa con filtros por query string.
import { AdminAuditPanel } from "@/components/admin/AdminAuditPanel";
import { readAdminAuditPageQuery } from "@/services/admin/internal/read-admin-audit-query";
import { getAdminAuditLogPage } from "@/services/admin/get-admin-audit-log-page";

interface IAdminAuditPageProps {
  params: Promise<{ portalSlug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function toUrlSearchParams(value: Record<string, string | string[] | undefined>): URLSearchParams {
  const output = new URLSearchParams();
  for (const [key, rawValue] of Object.entries(value)) {
    if (typeof rawValue === "string") output.set(key, rawValue);
  }
  return output;
}

export default async function AdminAuditPage({ params, searchParams }: IAdminAuditPageProps) {
  const [{ portalSlug }, queryParams] = await Promise.all([params, searchParams]);
  const runtime = await getAdminAuditLogPage(queryParams);
  const query = readAdminAuditPageQuery(toUrlSearchParams(queryParams));
  return <AdminAuditPanel portalSlug={portalSlug} page={runtime.page} query={query} cardVisualById={runtime.cardVisualById} />;
}
