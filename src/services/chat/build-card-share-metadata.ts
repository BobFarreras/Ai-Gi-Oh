// src/services/chat/build-card-share-metadata.ts - Construye EN EL SERVIDOR la metadata de un mensaje
// CARD_SHARE a partir de la carta real del jugador.
//
// Frontera de seguridad: la metadata de un mensaje es entrada del usuario, y la carta compartida se pinta
// desde ella (nombre, stats y las URLs de imagen). Si se confiara en lo que manda el cliente, cualquiera
// podría publicar una carta inventada con las estadísticas que quisiera o, peor, apuntar la imagen a una URL
// externa arbitraria que se cargaría en el navegador de todos los que abran el chat. Por eso aquí solo se
// acepta del cliente el `cardId`: el resto se reconstruye desde su colección y su progresión reales.
import { ICard } from "@/core/entities/ICard";
import { ValidationError } from "@/core/errors/ValidationError";
import { applyCardProgressionToCard } from "@/services/game/apply-card-progression-to-card";
import { createPlayerRuntimeRepositories } from "@/services/player-persistence/create-player-runtime-repositories";

/** Instantánea de la carta que consume `reconstructSharedCard` al pintar el mensaje. */
function toShareMetadata(card: ICard): Record<string, unknown> {
  return {
    cardId: card.id,
    name: card.name,
    type: card.type,
    faction: card.faction,
    cost: card.cost,
    attack: card.attack ?? null,
    defense: card.defense ?? null,
    archetype: card.archetype ?? null,
    renderUrl: card.renderUrl ?? null,
    bgUrl: card.bgUrl ?? null,
    versionTier: card.versionTier ?? 0,
    level: card.level ?? 0,
  };
}

/**
 * Devuelve la metadata de un CARD_SHARE para `cardId`, verificando que el jugador posee esa carta.
 * Las estadísticas son las reales del jugador (nivel/versión aplicados), no las que diga el cliente.
 */
export async function buildCardShareMetadata(playerId: string, rawCardId: unknown): Promise<Record<string, unknown>> {
  const cardId = typeof rawCardId === "string" ? rawCardId.trim() : "";
  if (!cardId) throw new ValidationError("Carta no válida para compartir.");

  const repositories = await createPlayerRuntimeRepositories();
  const [collection, progressRows] = await Promise.all([
    repositories.collectionRepository.getCollection(playerId),
    repositories.playerCardProgressRepository.listByPlayer(playerId),
  ]);

  const owned = collection.find((entry) => entry.card.id === cardId);
  if (!owned) throw new ValidationError("No puedes compartir una carta que no está en tu colección.");

  const progress = progressRows.find((row) => row.cardId === cardId) ?? null;
  return toShareMetadata(applyCardProgressionToCard(owned.card, progress));
}
