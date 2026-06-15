// src/components/game/board/internal/player-hand/hand-props-equality.ts - Comparadores por contenido para memoizar las manos del jugador y evitar re-renders en acciones ajenas.
import { ICard } from "@/core/entities/ICard";
import type { PlayerHandProps } from "@/components/game/board/PlayerHand";
import type { MobilePlayerHandProps } from "@/components/game/board/MobilePlayerHand";

/**
 * Igualdad de manos por identidad de carta (runtimeId/id) y longitud: las cartas
 * en mano no mutan sus datos visibles, así que comparar por id es seguro y barato.
 */
export function areHandsEqual(previous: ICard[], next: ICard[]): boolean {
  if (previous === next) return true;
  if (previous.length !== next.length) return false;
  for (let index = 0; index < previous.length; index += 1) {
    if ((previous[index].runtimeId ?? previous[index].id) !== (next[index].runtimeId ?? next[index].id)) return false;
  }
  return true;
}

/** Igualdad de listas de ids (cartas destacadas/obligatorias). */
export function areIdListsEqual(previous: string[] = [], next: string[] = []): boolean {
  if (previous === next) return true;
  if (previous.length !== next.length) return false;
  for (let index = 0; index < previous.length; index += 1) {
    if (previous[index] !== next[index]) return false;
  }
  return true;
}

/** Comparador de la mano de escritorio: re-render solo si cambia algo que afecta su render. */
export function areEqualPlayerHandProps(previous: PlayerHandProps, next: PlayerHandProps): boolean {
  return (
    areHandsEqual(previous.hand, next.hand) &&
    areIdListsEqual(previous.highlightedCardIds, next.highlightedCardIds) &&
    previous.playingCard === next.playingCard &&
    previous.hasSummoned === next.hasSummoned &&
    previous.isPlayerTurn === next.isPlayerTurn &&
    previous.cardScale === next.cardScale &&
    previous.overlapPx === next.overlapPx &&
    previous.handYOffsetPx === next.handYOffsetPx &&
    previous.containerHeightPx === next.containerHeightPx &&
    previous.hoverLiftPx === next.hoverLiftPx &&
    previous.centerOffsetPx === next.centerOffsetPx &&
    previous.dockRight === next.dockRight &&
    previous.bottomPx === next.bottomPx &&
    previous.isMobileLayout === next.isMobileLayout &&
    previous.showInlineActionPopover === next.showInlineActionPopover &&
    previous.onMandatoryCardSelect === next.onMandatoryCardSelect &&
    previous.onCardClick === next.onCardClick &&
    previous.onPlayAction === next.onPlayAction
  );
}

/** Comparador de la mano móvil. */
export function areEqualMobilePlayerHandProps(previous: MobilePlayerHandProps, next: MobilePlayerHandProps): boolean {
  return (
    areHandsEqual(previous.hand, next.hand) &&
    areIdListsEqual(previous.highlightedCardIds, next.highlightedCardIds) &&
    previous.playingCard === next.playingCard &&
    previous.isPlayerTurn === next.isPlayerTurn &&
    previous.bottomOffsetPx === next.bottomOffsetPx &&
    previous.onMandatoryCardSelect === next.onMandatoryCardSelect &&
    previous.onCardClick === next.onCardClick
  );
}
