// src/app/admin-portal/[portalSlug]/market/page.tsx - Renderiza módulo separado de administración de mercado (listings y packs).
import { AdminMarketPanel } from "@/components/admin/AdminMarketPanel";
import { getAdminCatalogSnapshot } from "@/services/admin/get-admin-catalog-snapshot";

interface AdminMarketPageProps {
  params: Promise<{ portalSlug: string }>;
}

export default async function AdminMarketPage({ params }: AdminMarketPageProps) {
  await params;
  const initialSnapshot = await getAdminCatalogSnapshot();
  return <AdminMarketPanel initialSnapshot={initialSnapshot} />;
}
