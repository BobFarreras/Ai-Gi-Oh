// src/components/hub/home/internal/dnd/home-drop-handler-deps.ts - Contratos compartidos para construir handlers de drag and drop en Home.
import { Dispatch, DragEvent, SetStateAction } from "react";
import { ICollectionCard } from "@/core/entities/home/ICollectionCard";
import { IDeck } from "@/core/entities/home/IDeck";
import { IHomeDraggedCardState } from "@/components/hub/home/internal/types/home-deck-builder-types";

export interface IDeckBuilderActionContext {
  playerId: string;
  deck: IDeck;
  collection: ICollectionCard[];
}

export interface IHomeDropHandlerDeps {
  deck: IDeck;
  collectionState: ICollectionCard[];
  context: IDeckBuilderActionContext;
  play: (soundId: "ADD_CARD" | "REMOVE_CARD") => void;
  beginMutation: () => number;
  isLatestMutation: (mutationId: number) => boolean;
  setDeck: Dispatch<SetStateAction<IDeck>>;
  setDraggedCard: Dispatch<SetStateAction<IHomeDraggedCardState | null>>;
  setErrorMessage: Dispatch<SetStateAction<string | null>>;
  resolveActionErrorMessage: (error: unknown, fallback: string) => string;
}

export interface IHomeDropEventInput {
  event: DragEvent<HTMLElement>;
}
