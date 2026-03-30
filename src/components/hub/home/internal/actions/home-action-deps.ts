// src/components/hub/home/internal/actions/home-action-deps.ts - Contratos compartidos para acciones principales del builder de Home.
import { Dispatch, SetStateAction } from "react";
import { ICollectionCard } from "@/core/entities/home/ICollectionCard";
import { IDeck } from "@/core/entities/home/IDeck";
import { IPlayerCardProgress } from "@/core/entities/progression/IPlayerCardProgress";
import { IHomeActionResult } from "@/components/hub/home/layout/home-workspace-types";
import { IHomeEvolutionOverlayState } from "@/components/hub/home/internal/types/home-deck-builder-types";

export interface IHomeDeckActionContext {
  playerId: string;
  deck: IDeck;
  collection: ICollectionCard[];
}

export interface IHomeActionDeps {
  context: IHomeDeckActionContext;
  deck: IDeck;
  collectionState: ICollectionCard[];
  cardProgressById: Map<string, IPlayerCardProgress>;
  setDeck: Dispatch<SetStateAction<IDeck>>;
  setCollectionState: Dispatch<SetStateAction<ICollectionCard[]>>;
  setCardProgressById: Dispatch<SetStateAction<Map<string, IPlayerCardProgress>>>;
  setErrorMessage: Dispatch<SetStateAction<string | null>>;
  setEvolutionOverlay: Dispatch<SetStateAction<IHomeEvolutionOverlayState | null>>;
  enqueueDeckMutation: <TResult>(input: {
    applyOptimistic: () => void;
    run: () => Promise<TResult>;
    onSuccess: (result: TResult) => Promise<void> | void;
    onError: (error: unknown) => Promise<void> | void;
  }) => Promise<TResult | null>;
  resolveActionErrorMessage: (error: unknown, fallback: string) => string;
  play: (soundId: "ADD_CARD" | "REMOVE_CARD" | "EVOLUTION_BUTTON") => void;
}

export type HomeActionHandler = () => Promise<IHomeActionResult>;
