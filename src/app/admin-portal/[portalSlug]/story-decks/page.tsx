// src/app/admin-portal/[portalSlug]/story-decks/page.tsx - Renderiza módulo admin para catálogo de oponentes Story y edición de mazos.
import { AdminStoryDeckPanel } from "@/components/admin/AdminStoryDeckPanel";
import { getAdminStoryDeckData } from "@/services/admin/get-admin-story-deck-data";

interface AdminStoryDecksPageProps {
  params: Promise<{ portalSlug: string }>;
}

export default async function AdminStoryDecksPage({ params }: AdminStoryDecksPageProps) {
  await params;
  const runtime = await getAdminStoryDeckData();
  return <AdminStoryDeckPanel initialData={{ ...runtime.data, availableCards: runtime.availableCards }} />;
}
