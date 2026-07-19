// src/app/api/story/overworld/claim-reward/internal/resolve-claim-reward.ts - Deriva del registro de nodos
// (código, no cliente) QUÉ otorga un nodo de recompensa del overworld. Puro y testeable: la ruta solo ejecuta.
import { IStoryMapVirtualNodeDefinition } from "@/services/story/map-definitions/story-map-definition-types";
import { InventoryItemType } from "@/infrastructure/persistence/supabase/SupabasePlayerInventoryRepository";

export interface IClaimRewardPlan {
  rewardNexus: number;
  rewardCardId: string | null;
  /** Solo nodos REWARD_OBJECT con configuración completa (tipo + id). */
  rewardObject: { itemType: InventoryItemType; itemId: string; quantity: number } | null;
}

/** null = el nodo no es una recompensa reclamable (o está mal configurado). */
export function resolveClaimRewardPlan(definition: IStoryMapVirtualNodeDefinition | null): IClaimRewardPlan | null {
  if (!definition) return null;
  if (definition.nodeType === "REWARD_NEXUS") {
    return { rewardNexus: definition.rewardNexus, rewardCardId: null, rewardObject: null };
  }
  if (definition.nodeType === "REWARD_CARD") {
    return { rewardNexus: 0, rewardCardId: definition.rewardCardId ?? null, rewardObject: null };
  }
  if (definition.nodeType === "REWARD_OBJECT") {
    if (!definition.rewardObjectType || !definition.rewardObjectId) return null;
    return {
      rewardNexus: 0,
      rewardCardId: null,
      rewardObject: {
        itemType: definition.rewardObjectType,
        itemId: definition.rewardObjectId,
        quantity: Math.max(1, Math.trunc(definition.rewardObjectQuantity ?? 1)),
      },
    };
  }
  return null;
}
