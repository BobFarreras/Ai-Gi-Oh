// src/components/game/board/internal/side-panels-state.ts - Centraliza estado derivado y layout de SidePanels para mantener el componente principal compacto.
import { useEffect, useMemo, useState } from "react";
import { ICard } from "@/core/entities/ICard";
import { GameState } from "@/core/use-cases/GameEngine";

type IActorFilter = "ALL" | "PLAYER" | "OPPONENT";

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export const detailPanelClass =
  "absolute left-0 top-[clamp(6.25rem,12vh,9.25rem)] bottom-[clamp(8.25rem,22vh,14.25rem)] w-[clamp(17rem,32vw,23rem)] bg-zinc-950/84 border-r-2 border-cyan-500/50 z-[90] p-4 md:p-5 backdrop-blur-2xl shadow-[20px_0_50px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden rounded-r-3xl min-h-0";
export const historyPanelClass =
  "absolute right-3 md:right-5 top-[clamp(5.75rem,11vh,8.5rem)] bottom-[clamp(6.75rem,18vh,11.75rem)] w-[clamp(17rem,34vw,24rem)] bg-zinc-950/88 border-l-2 border-red-500/50 z-[90] p-4 md:p-5 backdrop-blur-2xl shadow-[-20px_0_50px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden rounded-l-3xl min-h-0";

export function useDetailCardScale(): number {
  const [detailCardScale, setDetailCardScale] = useState(0.6);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const updateScale = () => {
      const panelWidth = clamp(window.innerWidth * 0.32, 272, 368);
      const panelHeight = clamp(window.innerHeight * 0.28, 192, 240);
      const widthRatio = (panelWidth - 24) / 260;
      const heightRatio = (panelHeight - 12) / 380;
      setDetailCardScale(clamp(Math.min(widthRatio, heightRatio), 0.38, 0.66));
    };
    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, []);
  return detailCardScale;
}

export function useCardLookup(gameState: GameState): Record<string, ICard> {
  return useMemo(() => {
    const cards = [
      ...gameState.playerA.deck, ...gameState.playerB.deck, ...gameState.playerA.hand, ...gameState.playerB.hand,
      ...gameState.playerA.graveyard, ...gameState.playerB.graveyard,
      ...gameState.playerA.activeEntities.map((entity) => entity.card), ...gameState.playerB.activeEntities.map((entity) => entity.card),
      ...gameState.playerA.activeExecutions.map((entity) => entity.card), ...gameState.playerB.activeExecutions.map((entity) => entity.card),
    ];
    return cards.reduce<Record<string, ICard>>((acc, card) => {
      acc[card.id] = card;
      return acc;
    }, {});
  }, [gameState]);
}

export function useVisibleCombatEvents(gameState: GameState, turnFilter: number | "ALL", actorFilter: IActorFilter) {
  return useMemo(() => {
    const actorToId = { PLAYER: gameState.playerA.id, OPPONENT: gameState.playerB.id } as const;
    return gameState.combatLog.filter((event) => {
      if (event.eventType === "ATTACK_DECLARED") return false;
      const turnMatches = turnFilter === "ALL" || event.turn === turnFilter;
      const actorMatches = actorFilter === "ALL" || event.actorPlayerId === actorToId[actorFilter];
      return turnMatches && actorMatches;
    });
  }, [actorFilter, gameState.combatLog, gameState.playerA.id, gameState.playerB.id, turnFilter]);
}
