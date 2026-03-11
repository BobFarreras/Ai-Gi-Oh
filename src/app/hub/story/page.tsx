// src/app/hub/story/page.tsx - Renderiza Story con datos reales del jugador y layout full-screen responsivo.
import Link from "next/link";
import { StoryScene } from "@/components/hub/story/StoryScene";
import { buildStoryChapterBriefing } from "@/services/story/build-story-chapter-briefing";
import { resolveStoryPostDuelTransitionFromSearchParams } from "@/services/story/duel-flow/story-post-duel-transition";
import { getStoryMapRuntimeData } from "@/services/story/get-story-map-runtime-data";

interface IStoryPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function StoryPage({ searchParams }: IStoryPageProps) {
  const resolvedSearchParams = await searchParams;
  const runtime = await getStoryMapRuntimeData();
  if (!runtime) {
    return (
      <main className="hub-control-room-bg flex min-h-dvh items-center justify-center px-4 py-8">
        <div className="rounded-2xl border border-cyan-300/35 bg-slate-950/80 p-5 text-center text-cyan-100">
          <p className="text-sm font-semibold uppercase tracking-[0.2em]">Story no disponible</p>
          <p className="mt-2 text-sm text-slate-300">Debes iniciar sesión para acceder al mapa de historia.</p>
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
  const maxUnlockedChapter = runtime.nodes
    .filter((node) => node.isUnlocked)
    .reduce((maxChapter, node) => Math.max(maxChapter, node.chapter), 1);
  const briefing = buildStoryChapterBriefing(maxUnlockedChapter);
  const postDuelTransition = resolveStoryPostDuelTransitionFromSearchParams(resolvedSearchParams);

  return (
    <main className="flex h-[100dvh] w-full flex-col overflow-hidden bg-black">
      <StoryScene runtime={runtime} briefing={briefing} postDuelTransition={postDuelTransition} />
    </main>
  );
}
