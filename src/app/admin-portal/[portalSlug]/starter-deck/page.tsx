// src/app/admin-portal/[portalSlug]/starter-deck/page.tsx - Renderiza editor visual de plantilla starter deck para administración segura.
import { AdminStarterDeckPanel } from "@/components/admin/AdminStarterDeckPanel";
import { getAdminStarterDeckTemplateData } from "@/services/admin/get-admin-starter-deck-template-data";

interface AdminStarterDeckPageProps {
  params: Promise<{ portalSlug: string }>;
}

export default async function AdminStarterDeckPage({ params }: AdminStarterDeckPageProps) {
  await params;
  const runtime = await getAdminStarterDeckTemplateData();
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <AdminStarterDeckPanel initialData={{ ...runtime.data, availableCards: runtime.availableCards }} />
    </div>
  );
}
