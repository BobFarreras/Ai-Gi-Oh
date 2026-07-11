// src/services/chat/get-shareable-cards.ts - Cartas del jugador (hidratadas con su nivel/versión) disponibles para compartir en el chat.
import { ICard } from "@/core/entities/ICard";
import { getCurrentUserSession } from "@/services/auth/get-current-user-session";
import { createPlayerRuntimeRepositories } from "@/services/player-persistence/create-player-runtime-repositories";
import { applyCardProgressionToCard } from "@/services/game/apply-card-progression-to-card";

/** Devuelve las cartas que el jugador posee, con sus stats reales (nivel/versión), ordenadas por nombre. */
export async function getShareableCards(): Promise<ICard[]> {
  const session = await getCurrentUserSession();
  if (!session?.user.id) return [];
  const playerId = session.user.id;
  const repositories = await createPlayerRuntimeRepositories();
  const [collection, progressRows] = await Promise.all([
    repositories.collectionRepository.getCollection(playerId),
    repositories.playerCardProgressRepository.listByPlayer(playerId),
  ]);
  const progressById = new Map(progressRows.map((progress) => [progress.cardId, progress]));
  return collection
    .map((entry) => applyCardProgressionToCard(entry.card, progressById.get(entry.card.id) ?? null))
    .sort((left, right) => left.name.localeCompare(right.name));
}
