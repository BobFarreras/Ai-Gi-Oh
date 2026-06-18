// src/components/hub/multiplayer/MultiplayerScene.tsx - Shell visual full-screen del lobby con atmósfera cyber/espacial y header de entrada.
import { ReactNode } from "react";
import { HubSectionEntryBurst } from "@/components/hub/sections/HubSectionEntryBurst";

interface MultiplayerSceneProps {
  children: ReactNode;
}

/**
 * Shell visual del lobby multijugador. Replica el patrón del Market: pantalla
 * full-screen con fondo `hub-control-room-bg`, sección central con borde cian
 * y shadow profundo, y burst de entrada. El contenido (children) es el layout
 * desktop/mobile que el orquestador decide.
 */
export function MultiplayerScene({ children }: MultiplayerSceneProps) {
  return (
    <main className="hub-control-room-bg relative box-border flex h-[100dvh] w-full flex-col overflow-hidden px-3 py-3 text-slate-100 sm:px-5">
      <HubSectionEntryBurst />
      <section className="mx-auto flex h-full max-h-[95dvh] w-full max-w-screen-2xl min-w-0 flex-col overflow-hidden rounded-3xl border border-cyan-900/40 bg-[#020a14]/88 p-3 shadow-[0_24px_50px_rgba(2,5,14,0.86)] backdrop-blur-xl sm:p-4">
        {children}
      </section>
    </main>
  );
}
