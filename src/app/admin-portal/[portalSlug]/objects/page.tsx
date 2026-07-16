// src/app/admin-portal/[portalSlug]/objects/page.tsx - Sección admin para gestionar los objetos del mercado
// (caramelos de nivel y objetos de mejora ATK/DEF).
import { AdminObjectsPanel } from "@/components/admin/AdminObjectsPanel";
import { getAdminShopObjects } from "@/services/admin/get-admin-shop-objects";

interface IAdminObjectsPageProps {
  params: Promise<{ portalSlug: string }>;
}

export default async function AdminObjectsPage({ params }: IAdminObjectsPageProps) {
  await params;
  const initialSnapshot = await getAdminShopObjects();
  return <AdminObjectsPanel initialSnapshot={initialSnapshot} />;
}
