// src/components/admin/internal/admin-starter-deck-dnd.ts - Utilidades de drag and drop para intercambio entre deck y almacén admin.
import { DragEvent } from "react";

const DRAG_CARD_PREFIX = "card:";
const DRAG_SLOT_PREFIX = "slot:";

export type AdminStarterDeckDragData = { type: "card"; cardId: string } | { type: "slot"; slotIndex: number };

/**
 * Serializa origen de arrastre para soportar mover carta desde almacén o slot del deck.
 */
export function writeAdminStarterDeckDragData(event: DragEvent<HTMLElement>, payload: AdminStarterDeckDragData): void {
  const raw = payload.type === "card" ? `${DRAG_CARD_PREFIX}${payload.cardId}` : `${DRAG_SLOT_PREFIX}${payload.slotIndex}`;
  event.dataTransfer.setData("text/plain", raw);
  event.dataTransfer.effectAllowed = "move";
}

/**
 * Deserializa payload de drag y descarta contenido inválido.
 */
export function readAdminStarterDeckDragData(event: DragEvent<HTMLElement>): AdminStarterDeckDragData | null {
  const raw = event.dataTransfer.getData("text/plain");
  if (raw.startsWith(DRAG_CARD_PREFIX)) {
    const cardId = raw.slice(DRAG_CARD_PREFIX.length).trim();
    if (cardId.length > 0) return { type: "card", cardId };
    return null;
  }
  if (raw.startsWith(DRAG_SLOT_PREFIX)) {
    const slotValue = raw.slice(DRAG_SLOT_PREFIX.length).trim();
    const slotIndex = Number(slotValue);
    if (Number.isInteger(slotIndex) && slotIndex >= 0) return { type: "slot", slotIndex };
    return null;
  }
  return null;
}

