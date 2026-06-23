// src/app/admin-portal/[portalSlug]/live-ops/page.tsx - Renderiza el panel admin de live-ops (misiones y promociones editables).
import { AdminLiveOpsPanel } from "@/components/admin/AdminLiveOpsPanel";
import { getAdminLiveOps } from "@/services/admin/get-admin-live-ops";

interface IAdminLiveOpsPageProps {
  params: Promise<{ portalSlug: string }>;
}

export default async function AdminLiveOpsPage({ params }: IAdminLiveOpsPageProps) {
  await params;
  const data = await getAdminLiveOps();
  return <AdminLiveOpsPanel data={data} />;
}
