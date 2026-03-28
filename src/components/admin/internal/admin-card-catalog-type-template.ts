// src/components/admin/internal/admin-card-catalog-type-template.ts - Genera valores de ejemplo por tipo para acelerar altas en el catálogo admin.
import { ADMIN_CARD_DEFAULT_BG_URL, IAdminCardCatalogDraft } from "@/components/admin/internal/admin-card-catalog-draft";
import { CardType } from "@/core/entities/ICard";

function setIfEmpty(current: string, value: string, force: boolean): string {
  return force || current.trim().length === 0 ? value : current;
}

export function applyCardTypeTemplate(draft: IAdminCardCatalogDraft, nextType: CardType, force: boolean): IAdminCardCatalogDraft {
  const typeTag = nextType.toLowerCase();
  const defaultRenderUrl = nextType === "EXECUTION"
    ? "/assets/renders/executions/exec-example-card.webp"
    : nextType === "TRAP"
      ? "/assets/renders/traps/trap-example-card.webp"
      : "/assets/renders/example-card.webp";
  const base = {
    ...draft,
    type: nextType,
    bgUrl: nextType === "EXECUTION" || nextType === "TRAP" ? "" : ADMIN_CARD_DEFAULT_BG_URL,
    id: setIfEmpty(draft.id, `${typeTag}-example-card`, force),
    name: setIfEmpty(draft.name, `${nextType} Example`, force),
    description: setIfEmpty(draft.description, `Carta de ejemplo tipo ${nextType}.`, force),
    renderUrl: setIfEmpty(draft.renderUrl, defaultRenderUrl, force),
  };

  if (nextType === "ENTITY") {
    return { ...base, costText: setIfEmpty(draft.costText, "3", force), attackText: setIfEmpty(draft.attackText, "1200", force), defenseText: setIfEmpty(draft.defenseText, "1000", force), archetype: force || draft.archetype === "NONE" ? "TOOL" : draft.archetype, trigger: "NONE", effectJson: force ? "" : draft.effectJson };
  }
  if (nextType === "FUSION") {
    return {
      ...base,
      id: setIfEmpty(draft.id, "fusion-example-card", force),
      name: setIfEmpty(draft.name, "Fusion Example", force),
      costText: setIfEmpty(draft.costText, "5", force),
      attackText: setIfEmpty(draft.attackText, "2200", force),
      defenseText: setIfEmpty(draft.defenseText, "1800", force),
      fusionRecipeId: setIfEmpty(draft.fusionRecipeId, "fusion-recipe-example", force),
      fusionMaterialIdsText: setIfEmpty(draft.fusionMaterialIdsText, "entity-a,entity-b", force),
      fusionEnergyRequirementText: setIfEmpty(draft.fusionEnergyRequirementText, "2", force),
      effectJson: setIfEmpty(draft.effectJson, '{"action":"FUSION_SUMMON","recipeId":"fusion-recipe-example","materialsRequired":2}', force),
      trigger: "NONE",
    };
  }
  if (nextType === "TRAP") {
    return {
      ...base,
      id: setIfEmpty(draft.id, "trap-example-card", force),
      name: setIfEmpty(draft.name, "Trap Example", force),
      costText: setIfEmpty(draft.costText, "2", force),
      attackText: force ? "" : draft.attackText,
      defenseText: force ? "" : draft.defenseText,
      trigger: force || draft.trigger === "NONE" ? "ON_OPPONENT_ATTACK_DECLARED" : draft.trigger,
      effectJson: setIfEmpty(draft.effectJson, '{"action":"NEGATE_ATTACK_AND_DESTROY_ATTACKER"}', force),
    };
  }
  if (nextType === "EXECUTION") {
    return {
      ...base,
      id: setIfEmpty(draft.id, "exec-example-card", force),
      name: setIfEmpty(draft.name, "Execution Example", force),
      costText: setIfEmpty(draft.costText, "1", force),
      attackText: force ? "" : draft.attackText,
      defenseText: force ? "" : draft.defenseText,
      trigger: "NONE",
      effectJson: setIfEmpty(draft.effectJson, '{"action":"DRAW_CARD","cards":1}', force),
    };
  }
  return {
    ...base,
    id: setIfEmpty(draft.id, "env-example-card", force),
    name: setIfEmpty(draft.name, "Environment Example", force),
    costText: setIfEmpty(draft.costText, "2", force),
    attackText: force ? "" : draft.attackText,
    defenseText: force ? "" : draft.defenseText,
    trigger: "NONE",
    effectJson: setIfEmpty(draft.effectJson, '{"action":"BOOST_ATTACK_ALLIED_ENTITY","value":200}', force),
  };
}
