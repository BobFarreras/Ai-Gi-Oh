// src/app/hub/story/page.tsx - Renderiza el mapa de circuito Story con nodos de oponentes y desbloqueo progresivo.
import Link from "next/link";
import { StoryCircuitMap } from "@/components/hub/story/StoryCircuitMap";
import { getStoryMapRuntimeData } from "@/services/story/get-story-map-runtime-data";

export default async function StoryPage() {
  const runtime = await getStoryMapRuntimeData();
  if (!runtime) {
    return (
      <main className="hub-control-room-bg flex min-h-dvh items-center justify-center px-4 py-8">
        <div className="rounded-2xl border border-cyan-300/35 bg-slate-950/80 p-5 text-center text-cyan-100">
          <p className="text-sm font-semibold uppercase tracking-[0.2em]">Story no disponible</p>
          <p className="mt-2 text-sm text-slate-300">Debes iniciar sesión para acceder al mapa de historia.</p>
          <Link href="/login" className="mt-4 inline-block rounded-md border border-cyan-300/40 px-4 py-2 text-sm font-bold uppercase">
            Ir a login
          </Link>
        </div>
      </main>
    );
  }
  return (
    <main className="hub-control-room-bg min-h-dvh px-4 py-6 sm:px-6">
      <div className="mx-auto mb-4 flex w-full max-w-6xl items-center justify-between rounded-xl border border-cyan-400/30 bg-slate-950/80 px-4 py-3 text-cyan-100">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-cyan-300">Circuito Story</p>
          <h1 className="text-2xl font-black uppercase">Mapa de Oponentes</h1>
        </div>
        <Link href="/hub" className="rounded-md border border-cyan-300/35 px-3 py-2 text-xs font-bold uppercase tracking-[0.16em]">
          Volver
        </Link>
      </div>
      <StoryCircuitMap nodes={runtime.nodes} />
    </main>
  );
}
