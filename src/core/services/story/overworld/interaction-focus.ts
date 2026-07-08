// src/core/services/story/overworld/interaction-focus.ts - Resuelve qué objeto puede interactuar el jugador (adyacente o pisado).
import { isRequirementSatisfied } from "@/core/services/story/overworld/interaction-rules";
import {
  IGridPosition,
  IOverworldProgressState,
  OverworldDirection,
  resolveDirectionDelta,
} from "@/core/services/story/overworld/overworld-types";

/**
 * Objetivo interactuable en términos puros del core (sin acoplar al schema del tilemap).
 * El motor construye esta lista a partir de los objetos del mapa.
 */
export interface IInteractableTarget {
  id: string;
  tileX: number;
  tileY: number;
  trigger: "ADJACENT_ACTION" | "STEP_ON";
  requiredNodeIds: ReadonlyArray<string>;
}

export interface IFocusedInteractable {
  target: IInteractableTarget;
  /** `true` si el objeto está gateado y aún no cumple sus requisitos. */
  isBlocked: boolean;
  missingRequirements: string[];
}

/**
 * Celda que el jugador tiene justo enfrente según su orientación.
 */
export function resolveFacingPosition(
  playerTile: IGridPosition,
  facing: OverworldDirection,
): IGridPosition {
  const delta = resolveDirectionDelta(facing);
  return { tileX: playerTile.tileX + delta.tileX, tileY: playerTile.tileY + delta.tileY };
}

function toFocused(
  target: IInteractableTarget,
  progress: IOverworldProgressState,
): IFocusedInteractable {
  const missingRequirements = target.requiredNodeIds.filter(
    (requiredNodeId) => !isRequirementSatisfied(requiredNodeId, progress),
  );
  return { target, isBlocked: missingRequirements.length > 0, missingRequirements };
}

/**
 * Objeto de acción adyacente enfocado: el que está en la celda que mira el jugador.
 * Es lo que la UI resalta y lo que se dispara al pulsar el botón de acción.
 */
export function resolveFocusedInteractable(input: {
  playerTile: IGridPosition;
  facing: OverworldDirection;
  targets: ReadonlyArray<IInteractableTarget>;
  progress: IOverworldProgressState;
}): IFocusedInteractable | null {
  const facingPosition = resolveFacingPosition(input.playerTile, input.facing);
  const target = input.targets.find(
    (candidate) =>
      candidate.trigger === "ADJACENT_ACTION" &&
      candidate.tileX === facingPosition.tileX &&
      candidate.tileY === facingPosition.tileY,
  );
  if (!target) return null;
  return toFocused(target, input.progress);
}

/**
 * Objeto de pisada (STEP_ON) sobre la celda actual del jugador: se dispara
 * automáticamente al llegar, sin necesidad de pulsar acción.
 */
export function resolveSteppedInteractable(input: {
  playerTile: IGridPosition;
  targets: ReadonlyArray<IInteractableTarget>;
  progress: IOverworldProgressState;
}): IFocusedInteractable | null {
  const target = input.targets.find(
    (candidate) =>
      candidate.trigger === "STEP_ON" &&
      candidate.tileX === input.playerTile.tileX &&
      candidate.tileY === input.playerTile.tileY,
  );
  if (!target) return null;
  return toFocused(target, input.progress);
}
