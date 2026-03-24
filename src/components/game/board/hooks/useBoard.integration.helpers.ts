// src/components/game/board/hooks/useBoard.integration.helpers.ts - Utilidades compartidas para escenarios de integración de useBoard.
import { vi } from "vitest";
import type { MouseEvent as ReactMouseEvent } from "react";
import { ICard } from "@/core/entities/ICard";

export function createMouseEvent(detail = 1): ReactMouseEvent {
  return { stopPropagation: vi.fn(), detail } as unknown as ReactMouseEvent;
}

export const integrationEntityCard: ICard = {
  id: "entity-integration-alpha",
  name: "Integration Alpha",
  description: "Carta estable para pruebas de integración del hook.",
  type: "ENTITY",
  faction: "NEUTRAL",
  cost: 2,
  attack: 1200,
  defense: 1000,
};
