// src/app/admin-portal/[portalSlug]/arena/page.tsx - Página admin de configuración de Arena (oponentes, mazos y tiers).
import { AdminArenaPanel } from "@/components/admin/AdminArenaPanel";

interface AdminArenaPageProps {
  params: Promise<{ portalSlug: string }>;
}

export default async function AdminArenaPage({ params }: AdminArenaPageProps) {
  await params;
  return <AdminArenaPanel />;
}
