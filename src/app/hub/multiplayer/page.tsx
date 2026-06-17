// src/app/hub/multiplayer/page.tsx - Lobby multijugador: presencia online, invitaciones y acceso a partidas.
import Link from "next/link";
import { redirect } from "next/navigation";
import { HubSectionEntryBurst } from "@/components/hub/sections/HubSectionEntryBurst";
import { MultiplayerLobby } from "@/components/hub/multiplayer/MultiplayerLobby";
import { getMultiplayerLobbyData } from "@/services/multiplayer/get-multiplayer-lobby-data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function MultiplayerPage() {
  const lobbyData = await getMultiplayerLobbyData();

  if (!lobbyData) {
    redirect("/login");
  }

  return (
    <main className="hub-control-room-bg h-full overflow-y-auto px-4 py-8 text-slate-100 sm:px-6">
      <HubSectionEntryBurst />

      <section className="mx-auto w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-800/90 bg-[#040b15]/90 p-6 shadow-[0_24px_46px_rgba(2,4,12,0.8)]">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-300/85">Módulo del Hub</p>
        <h1 className="mt-2 text-4xl font-black uppercase tracking-wide text-cyan-200">Multijugador</h1>
        <p className="mt-3 text-sm text-slate-300">
          Conecta con otros duelistas en tiempo real. Envía invitaciones y disputa partidas competitivas.
        </p>

        <div className="mt-6">
          <MultiplayerLobby
            localPlayerId={lobbyData.playerId}
            localNickname={lobbyData.nickname}
            activeDeckIds={lobbyData.activeDeckIds}
          />
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
