// src/app/hub/story/overworld/page.tsx - Página del overworld Story gateada por flag de entorno y sesión.
import Link from "next/link";
import { notFound } from "next/navigation";
import { OverworldDevScene } from "@/components/hub/story/overworld/OverworldDevScene";
import { getCurrentUserSession } from "@/services/auth/get-current-user-session";
import { getStoryOverworldRuntime } from "@/services/story/overworld/get-story-overworld-runtime";
import { DEFAULT_OVERWORLD_MAP_ID } from "@/services/story/overworld/resolve-overworld-tilemap";
import { isStoryOverworldEnabled } from "@/services/story/overworld/overworld-feature-flag";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface StoryOverworldPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function StoryOverworldPage({ searchParams }: StoryOverworldPageProps) {
  // Con el flag apagado la ruta no existe (404 real, sin filtrar que la feature está en curso).
  if (!isStoryOverworldEnabled()) notFound();
  const session = await getCurrentUserSession();
  if (!session) {
    return (
      <main className="hub-control-room-bg flex min-h-dvh items-center justify-center px-4 py-8">
        <div className="rounded-2xl border border-cyan-300/35 bg-slate-950/80 p-5 text-center text-cyan-100">
          <p className="text-sm font-semibold uppercase tracking-[0.2em]">Overworld no disponible</p>
          <p className="mt-2 text-sm text-slate-300">Debes iniciar sesión para acceder al mundo de historia.</p>
          <Link
            href="/login"
            className="mt-4 inline-block rounded-md border border-cyan-300/40 px-4 py-2 text-sm font-bold uppercase"
          >
            Ir a login
          </Link>
        </div>
      </main>
    );
  }
  const [runtime, resolvedSearchParams] = await Promise.all([
    getStoryOverworldRuntime(),
    searchParams,
  ]);
  // Al perder o abandonar un combate se reaparece al INICIO del acto (spawn), no en el sitio:
  // ignoramos la posición guardada y la escena persiste el spawn al montar.
  const outcome = resolvedSearchParams.outcome;
  const resetToActStart = outcome === "LOST" || outcome === "ABANDONED";
  // Nexus perdido por la derrota/abandono (aviso "-N Nexus" al reaparecer en el mapa).
  const penaltyRaw = resolvedSearchParams.penalty;
  const penaltyNexus = Number.parseInt(typeof penaltyRaw === "string" ? penaltyRaw : "", 10);
  return (
    <main className="flex h-[100svh] w-full flex-col overflow-hidden bg-black">
      <OverworldDevScene
        mapId={runtime?.currentMapId ?? DEFAULT_OVERWORLD_MAP_ID}
        completedNodeIds={runtime?.completedNodeIds ?? []}
        initialPosition={resetToActStart ? null : runtime?.initialPosition ?? null}
        interactedNodeIds={runtime?.interactedNodeIds ?? []}
        resetToActStart={resetToActStart}
        penaltyNexus={Number.isFinite(penaltyNexus) && penaltyNexus > 0 ? penaltyNexus : 0}
      />
    </main>
  );
}
