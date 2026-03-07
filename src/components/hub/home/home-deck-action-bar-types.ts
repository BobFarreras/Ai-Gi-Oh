// src/components/hub/home/home-deck-action-bar-types.ts - Tipos compartidos entre subcomponentes de la barra de acciones de Arsenal.
import {
  HomeCollectionOrderDirection,
  HomeCollectionOrderField,
  HomeCollectionTypeFilter,
} from "@/components/hub/home/home-filters";
import { IHomeActionResult } from "@/components/hub/home/layout/home-workspace-types";

export interface IHomeDeckActionBarProps {
  deckCount: number;
  deckSize: number;
  canInsert: boolean;
  canRemove: boolean;
  typeFilter: HomeCollectionTypeFilter;
  orderField: HomeCollectionOrderField;
  orderDirection: HomeCollectionOrderDirection;
  nameQuery: string;
  onNameQueryChange: (value: string) => void;
  onChangeTypeFilter: (value: HomeCollectionTypeFilter) => void;
  onChangeOrderField: (value: HomeCollectionOrderField) => void;
  onToggleOrderDirection: () => void;
  onInsert: () => Promise<IHomeActionResult>;
  onRemove: () => Promise<IHomeActionResult>;
  canEvolve: boolean;
  evolveCost: number | null;
  onEvolve: () => Promise<IHomeActionResult>;
}
