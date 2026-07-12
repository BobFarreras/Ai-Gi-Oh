// src/components/hub/community/reconstruct-shared-card.ts - Reconstruye una carta (para CardThumbnail) desde
// la metadata auto-contenida de un mensaje CARD_SHARE del chat (evita depender de la colección del receptor).
import { CardArchetype, CardType, Faction, ICard } from "@/core/entities/ICard";

export function reconstructSharedCard(metadata: Record<string, unknown>): ICard | null {
  const cardId = typeof metadata.cardId === "string" ? metadata.cardId : null;
  if (!cardId) return null;
  return {
    id: cardId,
    name: typeof metadata.name === "string" ? metadata.name : "Carta",
    description: "",
    type: (typeof metadata.type === "string" ? metadata.type : "ENTITY") as CardType,
    faction: (typeof metadata.faction === "string" ? metadata.faction : "NEUTRAL") as Faction,
    cost: typeof metadata.cost === "number" ? metadata.cost : 0,
    attack: typeof metadata.attack === "number" ? metadata.attack : undefined,
    defense: typeof metadata.defense === "number" ? metadata.defense : undefined,
    archetype: typeof metadata.archetype === "string" ? (metadata.archetype as CardArchetype) : undefined,
    renderUrl: typeof metadata.renderUrl === "string" ? metadata.renderUrl : undefined,
    bgUrl: typeof metadata.bgUrl === "string" ? metadata.bgUrl : undefined,
    versionTier: typeof metadata.versionTier === "number" ? metadata.versionTier : 0,
    level: typeof metadata.level === "number" ? metadata.level : 0,
  };
}
