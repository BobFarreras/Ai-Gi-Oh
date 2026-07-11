// src/app/hub/chat/actions/get-shareable-cards.ts - Server Action: lista las cartas del jugador para compartir en el chat.
"use server";

import { ICard } from "@/core/entities/ICard";
import { getShareableCards as getShareableCardsService } from "@/services/chat/get-shareable-cards";

export async function getShareableCards(): Promise<ICard[]> {
  return getShareableCardsService();
}
