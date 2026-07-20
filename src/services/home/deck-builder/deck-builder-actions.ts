// src/services/home/deck-builder/deck-builder-actions.ts - Orquesta acciones de Mi Home reutilizando casos de uso del dominio.
import { ICollectionCard } from "@/core/entities/home/ICollectionCard";
import { IDeck } from "@/core/entities/home/IDeck";
import { IPlayerCardProgress } from "@/core/entities/progression/IPlayerCardProgress";

interface IDeckActionContext {
  playerId: string;
  deck: IDeck;
  collection: ICollectionCard[];
  /** Doble Arsenal: si es "SECONDARY", las operaciones editan el 2º mazo (banco) vía ?slot=SECONDARY. */
  deckSlot?: "PRINCIPAL" | "SECONDARY";
}

/** Añade ?slot=SECONDARY a la ruta cuando se está editando el 2º mazo. */
function withSlot(path: string, context: IDeckActionContext): string {
  return context.deckSlot === "SECONDARY" ? `${path}${path.includes("?") ? "&" : "?"}slot=SECONDARY` : path;
}

async function parseDeckResponse(response: Response): Promise<IDeck> {
  const data = (await response.json()) as IDeck | { message?: string };
  if (!response.ok) {
    const message = typeof data === "object" && data && "message" in data ? data.message : undefined;
    throw new Error(message ?? "No se pudo completar la acción de deck.");
  }
  return data as IDeck;
}

export async function addCardToDeckAction(context: IDeckActionContext, cardId: string): Promise<IDeck> {
  const response = await fetch(withSlot("/api/home/deck/add", context), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ cardId }),
    cache: "no-store",
  });
  return parseDeckResponse(response);
}

export async function removeCardFromDeckAction(context: IDeckActionContext, slotIndex: number): Promise<IDeck> {
  const response = await fetch(withSlot("/api/home/deck/remove", context), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ slotIndex }),
    cache: "no-store",
  });
  return parseDeckResponse(response);
}

export async function addCardToDeckSlotAction(context: IDeckActionContext, cardId: string, slotIndex: number): Promise<IDeck> {
  const response = await fetch(withSlot("/api/home/deck/add-slot", context), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ cardId, slotIndex }),
    cache: "no-store",
  });
  return parseDeckResponse(response);
}

export async function addCardToFusionDeckAction(context: IDeckActionContext, cardId: string, slotIndex: number): Promise<IDeck> {
  const response = await fetch(withSlot("/api/home/deck/fusion/add", context), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ cardId, slotIndex }),
    cache: "no-store",
  });
  return parseDeckResponse(response);
}

export async function removeCardFromFusionDeckAction(context: IDeckActionContext, slotIndex: number): Promise<IDeck> {
  const response = await fetch(withSlot("/api/home/deck/fusion/remove", context), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ slotIndex }),
    cache: "no-store",
  });
  return parseDeckResponse(response);
}

export async function readCurrentDeckAction(context: IDeckActionContext): Promise<IDeck> {
  const response = await fetch(withSlot("/api/home/deck/current", context), { method: "GET", cache: "no-store" });
  return parseDeckResponse(response);
}

export async function moveDeckCardAction(context: IDeckActionContext, fromIndex: number, toIndex: number): Promise<IDeck> {
  void context;
  void fromIndex;
  void toIndex;
  throw new Error("Reordenar slots todavía no está disponible en persistencia remota.");
}

export async function saveDeckAction(context: IDeckActionContext): Promise<IDeck> {
  const response = await fetch(withSlot("/api/home/deck/save", context), { method: "POST", cache: "no-store" });
  return parseDeckResponse(response);
}

export interface IEvolveCardVersionResponse {
  progress: IPlayerCardProgress;
  collection: ICollectionCard[];
  consumedCopies: number;
}

export async function evolveCardVersionAction(playerId: string, cardId: string): Promise<IEvolveCardVersionResponse> {
  void playerId;
  const response = await fetch("/api/home/collection/evolve", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ cardId }),
    cache: "no-store",
  });
  const data = (await response.json()) as IEvolveCardVersionResponse | { message?: string };
  if (!response.ok) {
    const message = typeof data === "object" && data && "message" in data ? data.message : undefined;
    throw new Error(message ?? "No se pudo evolucionar la carta.");
  }
  return data as IEvolveCardVersionResponse;
}
