// src/app/admin-portal/[portalSlug]/effects/page.tsx - Página admin del glosario de efectos del juego.
import { AdminEffectsGlossaryPanel } from "@/components/admin/AdminEffectsGlossaryPanel";

interface AdminEffectsPageProps {
  params: Promise<{ portalSlug: string }>;
}

export default async function AdminEffectsPage({ params }: AdminEffectsPageProps) {
  await params;
  return <AdminEffectsGlossaryPanel />;
}
