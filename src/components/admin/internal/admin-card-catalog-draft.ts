// src/components/admin/internal/admin-card-catalog-draft.ts - Define draft editable del catálogo y conversiones seguras entre entry, comando y preview.
import { IAdminUpsertCardCatalogCommand } from "@/core/entities/admin/IAdminCatalogCommands";
import { IAdminCardCatalogEntry } from "@/core/entities/admin/IAdminCatalogSnapshot";
import { CardArchetype, CardType, Faction, ICard, TrapTrigger } from "@/core/entities/ICard";
export const ADMIN_CARD_DEFAULT_BG_URL = "/assets/bgs/bg-tech.jpg";
export interface IAdminCardCatalogDraft {
  id: string;
  name: string;
  description: string;
  type: CardType;
  faction: Faction;
  costText: string;
  attackText: string;
  defenseText: string;
  archetype: CardArchetype | "NONE";
  trigger: TrapTrigger | "NONE";
  bgUrl: string;
  renderUrl: string;
  effectJson: string;
  fusionRecipeId: string;
  fusionMaterialIdsText: string;
  fusionEnergyRequirementText: string;
  isActive: boolean;
}
function parseNullableNumber(value: string): number | null {
  const normalized = value.trim();
  if (normalized.length === 0) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}
function parseEffectJson(effectJson: string): unknown {
  const normalized = effectJson.trim();
  if (normalized.length === 0) return null;
  try {
    return JSON.parse(normalized);
  } catch {
    throw new Error("El JSON de efecto no es válido.");
  }
}
function normalizeRenderUrl(value: string): string | null {
  const normalized = value.trim();
  if (normalized.length === 0) return null;
  return normalized.startsWith("/assets/renders/") ? normalized : `/assets/renders/${normalized.replace(/^\/+/, "")}`;
}
function normalizeBackgroundUrl(value: string): string | null {
  const normalized = value.trim();
  if (normalized.length === 0) return null;
  return normalized;
}
export function createEmptyCardDraft(): IAdminCardCatalogDraft {
  return {
    id: "",
    name: "",
    description: "",
    type: "ENTITY",
    faction: "NEUTRAL",
    costText: "0",
    attackText: "0",
    defenseText: "0",
    archetype: "NONE",
    trigger: "NONE",
    bgUrl: ADMIN_CARD_DEFAULT_BG_URL,
    renderUrl: "",
    effectJson: "",
    fusionRecipeId: "",
    fusionMaterialIdsText: "",
    fusionEnergyRequirementText: "",
    isActive: true,
  };
}
export function createDraftFromEntry(entry: IAdminCardCatalogEntry): IAdminCardCatalogDraft {
  return {
    id: entry.id,
    name: entry.name,
    description: entry.description,
    type: entry.type,
    faction: entry.faction,
    costText: String(entry.cost),
    attackText: entry.attack === null ? "" : String(entry.attack),
    defenseText: entry.defense === null ? "" : String(entry.defense),
    archetype: entry.archetype ?? "NONE",
    trigger: entry.trigger ?? "NONE",
    bgUrl: entry.bgUrl ?? "",
    renderUrl: entry.renderUrl ?? "",
    effectJson: entry.effect ? JSON.stringify(entry.effect, null, 2) : "",
    fusionRecipeId: entry.fusionRecipeId ?? "",
    fusionMaterialIdsText: entry.fusionMaterialIds.join(","),
    fusionEnergyRequirementText: entry.fusionEnergyRequirement === null ? "" : String(entry.fusionEnergyRequirement),
    isActive: entry.isActive,
  };
}
export function createCommandFromDraft(draft: IAdminCardCatalogDraft): IAdminUpsertCardCatalogCommand {
  const cost = Number(draft.costText);
  if (!Number.isFinite(cost)) throw new Error("El coste debe ser numérico.");
  const shouldDisableBackground = draft.type === "EXECUTION" || draft.type === "TRAP";
  return {
    id: draft.id.trim(),
    name: draft.name.trim(),
    description: draft.description.trim(),
    type: draft.type,
    faction: draft.faction,
    cost,
    attack: parseNullableNumber(draft.attackText),
    defense: parseNullableNumber(draft.defenseText),
    archetype: draft.archetype === "NONE" ? null : draft.archetype,
    trigger: draft.trigger === "NONE" ? null : draft.trigger,
    bgUrl: shouldDisableBackground ? null : normalizeBackgroundUrl(draft.bgUrl) ?? ADMIN_CARD_DEFAULT_BG_URL,
    renderUrl: normalizeRenderUrl(draft.renderUrl),
    effect: parseEffectJson(draft.effectJson),
    fusionRecipeId: draft.fusionRecipeId.trim().length === 0 ? null : draft.fusionRecipeId.trim(),
    fusionMaterialIds: draft.fusionMaterialIdsText.split(",").map((value) => value.trim()).filter((value) => value.length > 0),
    fusionEnergyRequirement: parseNullableNumber(draft.fusionEnergyRequirementText),
    isActive: draft.isActive,
  };
}
export function createPreviewCardFromDraft(draft: IAdminCardCatalogDraft): ICard {
  const command = createCommandFromDraft(draft);
  return {
    id: command.id.length > 0 ? command.id : "preview-card",
    name: command.name.length > 0 ? command.name : "PREVIEW",
    description: command.description.length > 0 ? command.description : "Completa los campos del formulario.",
    type: command.type,
    faction: command.faction,
    cost: command.cost,
    attack: command.attack ?? undefined,
    defense: command.defense ?? undefined,
    archetype: command.archetype ?? undefined,
    trigger: command.trigger ?? undefined,
    bgUrl: command.bgUrl ?? undefined,
    renderUrl: command.renderUrl ?? undefined,
    effect: command.effect as ICard["effect"],
    fusionRecipeId: command.fusionRecipeId ?? undefined,
    fusionMaterials: command.fusionMaterialIds,
    fusionEnergyRequirement: command.fusionEnergyRequirement ?? undefined,
  };
}
export function mapEntryToCard(entry: IAdminCardCatalogEntry): ICard {
  return {
    id: entry.id,
    name: entry.name,
    description: entry.description,
    type: entry.type,
    faction: entry.faction,
    cost: entry.cost,
    attack: entry.attack ?? undefined,
    defense: entry.defense ?? undefined,
    archetype: entry.archetype ?? undefined,
    trigger: entry.trigger ?? undefined,
    bgUrl: entry.bgUrl ?? undefined,
    renderUrl: entry.renderUrl ?? undefined,
    effect: entry.effect as ICard["effect"],
    fusionRecipeId: entry.fusionRecipeId ?? undefined,
    fusionMaterials: entry.fusionMaterialIds,
    fusionEnergyRequirement: entry.fusionEnergyRequirement ?? undefined,
  };
}
