// src/app/hub/story/overworld/page.tsx - Página del overworld Story gateada por flag de entorno y sesión.
import Link from "next/link";
import { notFound } from "next/navigation";
import { OverworldDevScene } from "@/components/hub/story/overworld/OverworldDevScene";
import { getCurrentUserSession } from "@/services/auth/get-current-user-session";
import { getStoryOverworldRuntime } from "@/services/story/overworld/get-story-overworld-runtime";

const OVERWORLD_MAP_ID = "act-1";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Flag server-side: mientras el overworld esté en desarrollo, la ruta no existe
 * en producción (404 real, sin filtrar que la feature está en curso).
 */
function isOverworldEnabled(): boolean {
  return process.env.STORY_OVERWORLD_ENABLED === "true";
}

export default async function StoryOverworldPage() {
  if (!isOverworldEnabled()) notFound();
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
  const runtime = await getStoryOverworldRuntime(OVERWORLD_MAP_ID);
  return (
    <main className="flex h-[100dvh] w-full flex-col overflow-hidden bg-black">
      <OverworldDevScene
        completedNodeIds={runtime?.completedNodeIds ?? []}
        initialPosition={runtime?.initialPosition ?? null}
        interactedNodeIds={runtime?.interactedNodeIds ?? []}
      />
    </main>
  );
}
