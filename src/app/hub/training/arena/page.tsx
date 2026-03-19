// src/app/hub/training/arena/page.tsx - Ruta legacy de arena redirigida al módulo canónico de Academia conservando el tier.
import { redirect } from "next/navigation";

interface ILegacyTrainingArenaPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function LegacyTrainingArenaPage({ searchParams }: ILegacyTrainingArenaPageProps) {
  const params = await searchParams;
  const tier = typeof params.tier === "string" ? `?tier=${encodeURIComponent(params.tier)}` : "";
  redirect(`/hub/academy/training/arena${tier}`);
}
