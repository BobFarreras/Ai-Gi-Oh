// src/app/hub/story/chapter/[chapter]/duel/[duelIndex]/page.tsx - Entry server-side de duelo Story con validación de acceso y carga de mazos.
import Link from "next/link";
import { StoryDuelClient } from "@/app/hub/story/chapter/[chapter]/duel/[duelIndex]/StoryDuelClient";
import { getStoryDuelRuntimeData } from "@/services/story/get-story-duel-runtime-data";

interface StoryDuelPageProps {
  params: Promise<{ chapter: string; duelIndex: string }>;
}

export default async function StoryDuelPage({ params }: StoryDuelPageProps) {
  const resolvedParams = await params;
  const chapter = Number.parseInt(resolvedParams.chapter, 10);
  const duelIndex = Number.parseInt(resolvedParams.duelIndex, 10);
  if (!Number.isInteger(chapter) || chapter <= 0 || !Number.isInteger(duelIndex) || duelIndex <= 0) {
    return <main className="hub-control-room-bg flex min-h-dvh items-center justify-center text-cyan-100">Duelo Story inválido.</main>;
  }
  const runtime = await getStoryDuelRuntimeData(chapter, duelIndex);
  if (!runtime) {
    return (
      <main className="hub-control-room-bg flex min-h-dvh items-center justify-center px-4 text-cyan-100">
        <div className="rounded-xl border border-cyan-300/35 bg-slate-950/80 p-4 text-center">
          <p className="text-sm font-bold uppercase">No disponible</p>
          <Link href="/hub/story" className="mt-3 inline-block rounded-md border border-cyan-300/40 px-3 py-2 text-xs font-bold uppercase">
            Volver al mapa Story
          </Link>
        </div>
      </main>
    );
  }
  if (!runtime.isUnlocked) {
    return (
      <main className="hub-control-room-bg flex min-h-dvh items-center justify-center px-4 text-cyan-100">
        <div className="rounded-xl border border-amber-300/40 bg-amber-950/45 p-4 text-center">
          <p className="text-sm font-bold uppercase text-amber-200">Duelo bloqueado</p>
          <p className="mt-1 text-sm text-amber-100">Completa el nodo anterior para desbloquear este combate.</p>
          <Link href="/hub/story" className="mt-3 inline-block rounded-md border border-amber-300/40 px-3 py-2 text-xs font-bold uppercase">
            Volver al mapa Story
          </Link>
        </div>
      </main>
    );
  }
  return <StoryDuelClient {...runtime} />;
}
