// src/components/admin/admin-story-deck-api.ts - Cliente HTTP para cargar/guardar mazos Story desde el panel administrativo.
import { ICard } from "@/core/entities/ICard";
import { IAdminStoryDeckData } from "@/core/entities/admin/IAdminStoryDeck";

export interface IAdminStoryDeckApiResponse extends IAdminStoryDeckData {
  availableCards: ICard[];
}

interface ISaveStoryDeckPayload {
  deckListId: string;
  cardIds: string[];
}

async function parseApiError(response: Response, fallback: string): Promise<Error> {
  try {
    const body = (await response.json()) as { message?: string; traceId?: string };
    const trace = body.traceId ? ` (traceId: ${body.traceId})` : "";
    return new Error(`${body.message ?? fallback}${trace}`);
  } catch {
    return new Error(fallback);
  }
}

export async function fetchAdminStoryDeckData(input: { opponentId?: string; deckListId?: string } = {}): Promise<IAdminStoryDeckApiResponse> {
  const query = new URLSearchParams();
  if (input.opponentId) query.set("opponentId", input.opponentId);
  if (input.deckListId) query.set("deckListId", input.deckListId);
  const suffix = query.toString() ? `?${query.toString()}` : "";
  const response = await fetch(`/api/admin/story-decks/deck${suffix}`, { method: "GET", cache: "no-store" });
  if (!response.ok) throw await parseApiError(response, "No se pudo cargar Story Decks admin.");
  return (await response.json()) as IAdminStoryDeckApiResponse;
}

export async function saveAdminStoryDeck(payload: ISaveStoryDeckPayload): Promise<void> {
  const response = await fetch("/api/admin/story-decks/deck", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw await parseApiError(response, "No se pudo guardar Story Deck admin.");
}

