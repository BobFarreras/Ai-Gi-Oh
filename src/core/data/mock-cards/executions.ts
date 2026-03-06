import { ICard } from "@/core/entities/ICard";

interface IExecutionSeed extends Omit<ICard, "type" | "renderUrl" | "bgUrl"> {
  renderFile: string;
}

function createExecution(seed: IExecutionSeed): ICard {
  return { ...seed, type: "EXECUTION", bgUrl: "/assets/bgs/bg-tech.jpg", renderUrl: `/assets/renders/${seed.renderFile}.png` };
}

export const EXECUTION_CARDS: ICard[] = [
  createExecution({
    id: "exec-boost-atk-400",
    name: "Refactor Burst",
    description: "Aumenta +400 el ATK de tu mejor entidad en campo.",
    renderFile: "make",
    faction: "NO_CODE",
    cost: 2,
    effect: { action: "BOOST_ATTACK_ALLIED_ENTITY", value: 400 },
  }),
  createExecution({
    id: "exec-draw-1",
    name: "Knowledge Pull",
    description: "Roba 1 carta del deck.",
    renderFile: "openclaw",
    faction: "OPEN_SOURCE",
    cost: 2,
    effect: { action: "DRAW_CARD", cards: 1 },
  }),
  createExecution({
    id: "exec-llm-def-300",
    name: "Prompt Shield",
    description: "Todas tus cartas LLM ganan +300 DEF.",
    renderFile: "chatgpt",
    faction: "BIG_TECH",
    cost: 3,
    effect: { action: "BOOST_DEFENSE_BY_ARCHETYPE", archetype: "LLM", value: 300 },
  }),
  createExecution({
    id: "exec-framework-atk-300",
    name: "Framework Sprint",
    description: "Todas tus cartas FRAMEWORK ganan +300 ATK.",
    renderFile: "vercel",
    faction: "BIG_TECH",
    cost: 3,
    effect: { action: "BOOST_ATTACK_BY_ARCHETYPE", archetype: "FRAMEWORK", value: 300 },
  }),
  createExecution({
    id: "exec-direct-damage-900",
    name: "Packet Storm",
    description: "Inflige 900 de daño directo al rival.",
    renderFile: "n8n",
    faction: "NO_CODE",
    cost: 3,
    effect: { action: "DAMAGE", target: "OPPONENT", value: 900 },
  }),
  createExecution({
    id: "exec-direct-damage-600",
    name: "Exploit Ping",
    description: "Inflige 600 de daño directo al rival.",
    renderFile: "kali-linux",
    faction: "OPEN_SOURCE",
    cost: 2,
    effect: { action: "DAMAGE", target: "OPPONENT", value: 600 },
  }),
  createExecution({
    id: "exec-heal-700",
    name: "Recovery Patch",
    description: "Recuperas 700 LP.",
    renderFile: "supabase",
    faction: "BIG_TECH",
    cost: 2,
    effect: { action: "HEAL", target: "PLAYER", value: 700 },
  }),
  createExecution({
    id: "exec-db-def-300",
    name: "Transaction Wall",
    description: "Todas tus cartas DB ganan +300 DEF.",
    renderFile: "postgress",
    faction: "OPEN_SOURCE",
    cost: 2,
    effect: { action: "BOOST_DEFENSE_BY_ARCHETYPE", archetype: "DB", value: 300 },
  }),
  createExecution({
    id: "exec-fusion-gemgpt",
    name: "Fusion Compiler",
    description: "Inicia fusión GemGPT: selecciona 2 materiales válidos en tu campo.",
    renderFile: "gemgpt",
    faction: "BIG_TECH",
    cost: 4,
    effect: { action: "FUSION_SUMMON", recipeId: "fusion-gemgpt", materialsRequired: 2 },
  }),
  createExecution({
    id: "exec-fusion-kaclauli",
    name: "Fusion Compiler: KaClauli",
    description: "Inicia fusión KaClauli: selecciona 2 materiales válidos en tu campo.",
    renderFile: "kaclauli",
    faction: "OPEN_SOURCE",
    cost: 4,
    effect: { action: "FUSION_SUMMON", recipeId: "fusion-kaclauli", materialsRequired: 2 },
  }),
  createExecution({
    id: "exec-fusion-pytgress",
    name: "Fusion Compiler: Pytgress",
    description: "Inicia fusión Pytgress: selecciona 2 materiales válidos en tu campo.",
    renderFile: "pytgress",
    faction: "OPEN_SOURCE",
    cost: 4,
    effect: { action: "FUSION_SUMMON", recipeId: "fusion-pytgress", materialsRequired: 2 },
  }),
];
