// src/app/admin-portal/[portalSlug]/pve-modes/page.tsx - Página admin de configuración de Supervivencia y Olimpo.
import { AdminPveModesPanel } from "@/components/admin/AdminPveModesPanel";

interface AdminPveModesPageProps {
  params: Promise<{ portalSlug: string }>;
}

export default async function AdminPveModesPage({ params }: AdminPveModesPageProps) {
  await params;
  return <AdminPveModesPanel />;
}
