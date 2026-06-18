// src/app/hub/ranking/page.tsx - Tabla de clasificación global de jugadores por ELO.
import Link from "next/link";
import { HubSectionEntryBurst } from "@/components/hub/sections/HubSectionEntryBurst";
import { RankingTable } from "@/components/hub/ranking/RankingTable";
import { getRankingData } from "@/services/ranking/get-ranking-data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function RankingPage() {
  const { entries, localPlayerId, localPlayerRank } = await getRankingData();

  return (
    <main className="hub-control-room-bg h-full overflow-y-auto px-4 py-8 text-slate-100 sm:px-6">
      <HubSectionEntryBurst />

      <section className="mx-auto w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-800/90 bg-[#040b15]/90 p-6 shadow-[0_24px_46px_rgba(2,4,12,0.8)]">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-300/85">Módulo del Hub</p>
        <h1 className="mt-2 text-4xl font-black uppercase tracking-wide text-cyan-200">Ranking</h1>
        <p className="mt-3 text-sm text-slate-300">
          Clasificación global de duelistas ordenada por puntuación ELO. El ELO inicial es 1200.
        </p>

        {localPlayerRank && (
          <div className="mt-4 inline-flex items-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-3 py-2">
            <span className="text-xs font-bold uppercase tracking-widest text-cyan-300">Tu posición</span>
            <span className="text-sm font-black text-cyan-100">#{localPlayerRank}</span>
          </div>
        )}

        <div className="mt-6">
          <RankingTable entries={entries} localPlayerId={localPlayerId} />
        </div>

        <Link
          href="/hub"
          aria-label="Volver a sala de control"
          className="mt-7 inline-block rounded-lg border border-cyan-300/35 px-4 py-2 text-sm font-bold uppercase tracking-wide text-cyan-200 transition hover:bg-cyan-400/10"
        >
          Volver a Sala de Control
        </Link>
      </section>
    </main>
  );
}
