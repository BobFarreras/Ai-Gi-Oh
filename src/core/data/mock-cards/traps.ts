// src/core/data/mock-cards/traps.ts - Descripción breve del módulo.
import { ICard } from "@/core/entities/ICard";

interface ITrapSeed extends Omit<ICard, "type" | "renderUrl" | "bgUrl"> {
  renderFile: string;
}

function createTrap(seed: ITrapSeed): ICard {
  return {
    ...seed,
    type: "TRAP",
    bgUrl: undefined,
    renderUrl: `/assets/renders/traps/${seed.id}.webp`,
  };
}

export const TRAP_CARDS: ICard[] = [
  createTrap({
    id: "trap-counter-intrusion",
    name: "Counter Intrusion",
    description: "Cuando el rival declara ataque, inflige 500 de daño directo al rival.",
    renderFile: "kali-linux",
    faction: "OPEN_SOURCE",
    cost: 2,
    trigger: "ON_OPPONENT_ATTACK_DECLARED",
    effect: { action: "DAMAGE", target: "OPPONENT", value: 500 },
  }),
  createTrap({
    id: "trap-runtime-punish",
    name: "Runtime Punish",
    description: "Cuando el rival activa una ejecución, inflige 400 de daño al rival.",
    renderFile: "openclaw",
    faction: "NO_CODE",
    cost: 2,
    trigger: "ON_OPPONENT_EXECUTION_ACTIVATED",
    effect: { action: "DAMAGE", target: "OPPONENT", value: 400 },
  }),
  createTrap({
    id: "trap-kernel-panic",
    name: "Kernel Panic",
    description: "Cuando el rival declara ataque, niega ese ataque y destruye la entidad atacante.",
    renderFile: "kali-linux",
    faction: "OPEN_SOURCE",
    cost: 3,
    trigger: "ON_OPPONENT_ATTACK_DECLARED",
    effect: { action: "NEGATE_ATTACK_AND_DESTROY_ATTACKER" },
  }),
  createTrap({
    id: "trap-atk-drain",
    name: "ATK Drain",
    description: "Cuando el rival declara ataque, reduce -300 ATK a todas sus entidades en campo.",
    renderFile: "n8n",
    faction: "NO_CODE",
    cost: 2,
    trigger: "ON_OPPONENT_ATTACK_DECLARED",
    effect: { action: "REDUCE_OPPONENT_ATTACK", value: 300 },
  }),
  createTrap({
    id: "trap-def-fragment",
    name: "DEF Fragment",
    description: "Cuando el rival activa una ejecución, reduce -300 DEF a todas sus entidades en campo.",
    renderFile: "openclaw",
    faction: "BIG_TECH",
    cost: 2,
    trigger: "ON_OPPONENT_EXECUTION_ACTIVATED",
    effect: { action: "REDUCE_OPPONENT_DEFENSE", value: 300 },
  }),
];

