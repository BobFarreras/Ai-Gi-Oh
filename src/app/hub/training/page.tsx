// src/app/hub/training/page.tsx - Simulador de entrenamiento que usa mazo persistido del jugador autenticado cuando está disponible.
import { Board } from "@/components/game/board";
import { HubSectionEntryBurst } from "@/components/hub/sections/HubSectionEntryBurst";
import { getPlayerBoardLoadout } from "@/services/game/get-player-board-deck";
import Link from "next/link";
import { HOME_DECK_SIZE } from "@/core/services/home/deck-rules";

export default async function TrainingPage() {
  const loadout = await getPlayerBoardLoadout();
  const isDeckReady = Boolean(loadout.deck && loadout.deck.length === HOME_DECK_SIZE);
  if (!isDeckReady) {
    return (
      <main className="hub-control-room-bg flex min-h-dvh items-center justify-center px-4 text-cyan-100">
        <HubSectionEntryBurst />
        <div className="rounded-xl border border-rose-300/45 bg-rose-950/40 p-4 text-center">
          <p className="text-sm font-black uppercase text-rose-100">Deck incompleto</p>
          <p className="mt-1 text-sm text-rose-100/90">Necesitas 20 cartas en Arsenal para entrar al combate de entrenamiento.</p>
          <Link href="/hub/home" className="mt-3 inline-block rounded-md border border-rose-200/45 px-3 py-2 text-xs font-bold uppercase">
            Ir a Arsenal
          </Link>
        </div>
      </main>
    );
  }
  return (
    <main className="min-h-screen bg-zinc-950">
      <HubSectionEntryBurst />
      <Board mode="TRAINING" initialPlayerDeck={loadout.deck} initialConfig={{ playerFusionDeck: loadout.fusionDeck }} />
    </main>
  );
}
