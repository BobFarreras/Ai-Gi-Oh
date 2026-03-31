// src/app/admin-portal/[portalSlug]/catalog/page.tsx - Renderiza módulo admin de catálogo de cartas con snapshot inicial server-side.
import { AdminCatalogPanel } from "@/components/admin/AdminCatalogPanel";
import { getAdminCatalogSnapshot } from "@/services/admin/get-admin-catalog-snapshot";

interface AdminCatalogPageProps {
  params: Promise<{ portalSlug: string }>;
}

export default async function AdminCatalogPage({ params }: AdminCatalogPageProps) {
  await params;
  const initialSnapshot = await getAdminCatalogSnapshot();
  return <AdminCatalogPanel initialSnapshot={initialSnapshot} />;
}
