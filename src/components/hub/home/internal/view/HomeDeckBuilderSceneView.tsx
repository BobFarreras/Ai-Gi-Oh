// src/components/hub/home/internal/view/HomeDeckBuilderSceneView.tsx - Renderiza la vista principal de Arsenal a partir de props del orquestador.
"use client";

import { ICard } from "@/core/entities/ICard";
import { HomeDeckActionBar } from "@/components/hub/home/HomeDeckActionBar";
import { HubErrorDialog } from "@/components/hub/internal/HubErrorDialog";
import { HomeEvolutionOverlay } from "@/components/hub/home/HomeEvolutionOverlay";
import { HomeResponsiveWorkspace } from "@/components/hub/home/layout/HomeResponsiveWorkspace";
import { IHomeWorkspaceProps } from "@/components/hub/home/layout/home-workspace-types";
import { HomeCollectionOrderDirection, HomeCollectionOrderField, HomeCollectionTypeFilter } from "@/components/hub/home/home-filters";
import { IHomeEvolutionOverlayState } from "@/components/hub/home/internal/types/home-deck-builder-types";
import { HomeIncompleteDeckExitDialog } from "@/components/hub/home/internal/view/HomeIncompleteDeckExitDialog";

export interface IHomeDeckBuilderSceneViewProps {
  deckCardCount: number;
  deckSize: number;
  canInsertSelectedCard: boolean;
  canRemoveSelectedCard: boolean;
  canEvolveSelectedCard: boolean;
  copiesRequiredToEvolve: number | null;
  typeFilter: HomeCollectionTypeFilter;
  orderField: HomeCollectionOrderField;
  orderDirection: HomeCollectionOrderDirection;
  nameQuery: string;
  workspaceProps: IHomeWorkspaceProps;
  evolutionOverlay: IHomeEvolutionOverlayState | null;
  evolutionCard: ICard | null;
  errorMessage: string | null;
  onNameQueryChange: (query: string) => void;
  onChangeTypeFilter: (filter: HomeCollectionTypeFilter) => void;
  onChangeOrderField: (field: HomeCollectionOrderField) => void;
  onToggleOrderDirection: () => void;
  onInsertSelectedCard: () => Promise<{ ok: boolean; message?: string }>;
  onRemoveSelectedCard: () => Promise<{ ok: boolean; message?: string }>;
  onEvolveSelectedCard: () => Promise<{ ok: boolean; message?: string }>;
  onBackToHub: () => void;
  onClearError: () => void;
  isExitDialogOpen: boolean;
  onCloseExitDialog: () => void;
  onConfirmExitToHub: () => void;
  onGoToMarket: () => void;
}

export function HomeDeckBuilderSceneView(props: IHomeDeckBuilderSceneViewProps) {
  return (
    <main className="hub-control-room-bg relative box-border w-full h-[100dvh] overflow-hidden px-3 py-3 text-slate-100 sm:px-5 flex flex-col justify-center items-center">
      <section className="mx-auto flex h-full max-h-[95dvh] w-full max-w-screen-2xl min-w-0 flex-col overflow-hidden rounded-3xl border border-cyan-900/40 bg-[#020a14]/88 p-3 shadow-[0_24px_50px_rgba(2,5,14,0.86)] backdrop-blur-xl sm:p-4 transition-all">
        <div className="shrink-0 z-20">
          <HomeDeckActionBar
            deckCount={props.deckCardCount}
            deckSize={props.deckSize}
            canInsert={props.canInsertSelectedCard}
            canRemove={props.canRemoveSelectedCard}
            typeFilter={props.typeFilter}
            orderField={props.orderField}
            orderDirection={props.orderDirection}
            nameQuery={props.nameQuery}
            onNameQueryChange={props.onNameQueryChange}
            onChangeTypeFilter={props.onChangeTypeFilter}
            onChangeOrderField={props.onChangeOrderField}
            onToggleOrderDirection={props.onToggleOrderDirection}
            onInsert={props.onInsertSelectedCard}
            onRemove={props.onRemoveSelectedCard}
            canEvolve={props.canEvolveSelectedCard}
            evolveCost={props.copiesRequiredToEvolve}
            onEvolve={props.onEvolveSelectedCard}
            onBackToHub={props.onBackToHub}
          />
        </div>
        <HomeResponsiveWorkspace {...props.workspaceProps} />
      </section>
      {props.evolutionOverlay && (
        <HomeEvolutionOverlay
          card={props.evolutionCard}
          fromVersionTier={props.evolutionOverlay.fromVersionTier}
          toVersionTier={props.evolutionOverlay.toVersionTier}
          level={props.evolutionOverlay.level}
          consumedCopies={props.evolutionOverlay.consumedCopies}
        />
      )}
      <HomeIncompleteDeckExitDialog
        isOpen={props.isExitDialogOpen}
        deckCardCount={props.deckCardCount}
        deckSize={props.deckSize}
        onClose={props.onCloseExitDialog}
        onExitToHub={props.onConfirmExitToHub}
        onGoToMarket={props.onGoToMarket}
      />
      <HubErrorDialog title="Error de Arsenal" message={props.errorMessage} onClose={props.onClearError} />
    </main>
  );
}
