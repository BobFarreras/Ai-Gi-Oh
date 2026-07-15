// src/components/hub/home/objects/ArsenalObjectsView.tsx - Shell de la sección Objetos del arsenal (mismo marco
// visual que el deck-builder) con su cabecera, el conmutador para volver a Cartas y el panel de objetos.
"use client";

import { ReactNode, useState } from "react";
import { BackButton } from "@/components/ui/BackButton";
import { HubErrorDialog } from "@/components/hub/internal/HubErrorDialog";
import { ICard } from "@/core/entities/ICard";
import { IPlayerCardProgress } from "@/core/entities/progression/IPlayerCardProgress";
import { ArsenalObjectsPanel } from "@/components/hub/home/objects/ArsenalObjectsPanel";

interface IArsenalObjectsViewProps {
  /** Carta objetivo del "Equipar objeto" (null = solo mirar el inventario de objetos). */
  targetCard: ICard | null;
  cardProgressById: Map<string, IPlayerCardProgress>;
  sectionSwitch: ReactNode;
  onCardLeveled: (cardId: string, level: number, xp: number) => void;
  onBackToHub: () => void;
}

export function ArsenalObjectsView({ targetCard, cardProgressById, sectionSwitch, onCardLeveled, onBackToHub }: IArsenalObjectsViewProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  return (
    <main className="hub-control-room-bg relative box-border flex h-[100dvh] w-full flex-col items-center justify-center overflow-hidden px-3 py-3 text-slate-100 sm:px-5">
      <section className="mx-auto flex h-full max-h-[95dvh] w-full max-w-screen-2xl min-w-0 flex-col overflow-hidden rounded-3xl border border-cyan-900/40 bg-[#020a14]/88 p-3 shadow-[0_24px_50px_rgba(2,5,14,0.86)] backdrop-blur-xl sm:p-4">
        <div className="mb-3 flex shrink-0 items-center gap-3">
          <BackButton href="/hub" onClick={onBackToHub} label="Menú" />
          <h1 className="text-xl font-black uppercase tracking-widest text-cyan-100 drop-shadow-[0_0_10px_rgba(34,211,238,0.6)] sm:text-2xl">Arsenal</h1>
        </div>
        <ArsenalObjectsPanel
          targetCard={targetCard}
          cardProgressById={cardProgressById}
          sectionSwitch={sectionSwitch}
          onCardLeveled={onCardLeveled}
          onError={setErrorMessage}
        />
      </section>
      <HubErrorDialog title="Objetos del Arsenal" message={errorMessage} onClose={() => setErrorMessage(null)} />
    </main>
  );
}
