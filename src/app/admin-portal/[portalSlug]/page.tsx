// src/app/admin-portal/[portalSlug]/page.tsx - Redirige la ruta base del portal admin al módulo principal Card Catalog.
import { redirect } from "next/navigation";

interface AdminPortalPageProps {
  params: Promise<{ portalSlug: string }>;
}

export default async function AdminPortalPage({ params }: AdminPortalPageProps) {
  const { portalSlug } = await params;
  redirect(`/admin-portal/${portalSlug}/catalog`);
}
