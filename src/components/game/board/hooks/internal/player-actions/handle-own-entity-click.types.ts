// src/components/game/board/hooks/internal/player-actions/handle-own-entity-click.types.ts - Contrato del flujo de clic sobre una entidad propia.
import type { MouseEvent } from "react";
import { IBoardEntity } from "@/core/entities/IPlayer";
import { IUsePlayerActionsParams } from "./types";

export interface IHandleOwnEntityClickParams extends Pick<
  IUsePlayerActionsParams,
  | "activeAttackerId"
  | "applyTransition"
  | "clearSelection"
  | "gameState"
  | "pendingFusionSummon"
  | "pendingEntityReplacement"
  | "pendingEntityReplacementTargetId"
  | "setActiveAttackerId"
  | "setLastError"
  | "setPendingEntityReplacementTargetId"
  | "setPendingFusionSummon"
  | "setPlayingCard"
  | "setSelectedCard"
  | "setSelectedBoardEntityInstanceId"
> {
  entity: IBoardEntity | null;
  event: MouseEvent;
}
