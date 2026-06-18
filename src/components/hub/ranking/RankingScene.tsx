// src/components/hub/ranking/RankingScene.tsx - Shell visual full-screen del ranking con atmósfera cyber/espacial del Hub.
import { ReactNode } from "react";
import { HubSectionEntryBurst } from "@/components/hub/sections/HubSectionEntryBurst";

interface RankingSceneProps {
  children: ReactNode;
}

/**
 * Shell visual del ranking. Replica el patrón de MultiplayerScene: pantalla
 * full-screen con fondo `hub-control-room-bg`, sección central con borde cian
 * y shadow profundo, y burst de entrada. El contenido lo aporta el cliente.
 */
export function RankingScene({ children }: RankingSceneProps) {
  return (
    <main className="hub-control-room-bg relative box-border flex h-[100dvh] w-full flex-col overflow-hidden px-3 py-3 text-slate-100 sm:px-5">
      <HubSectionEntryBurst />
      <section className="mx-auto flex h-full max-h-[95dvh] w-full max-w-screen-2xl min-w-0 flex-col overflow-hidden rounded-3xl border border-cyan-900/40 bg-[#020a14]/88 p-3 shadow-[0_24px_50px_rgba(2,5,14,0.86)] backdrop-blur-xl sm:p-4">
        {children}
      </section>
    </main>
  );
}
