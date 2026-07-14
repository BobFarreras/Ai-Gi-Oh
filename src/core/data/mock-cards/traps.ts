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
  // Lote de nuevas trampas (fases 3-5). Render por id: /assets/renders/traps/{id}.webp.
  createTrap({ id: "trap-windows-flag-infect", name: "Bandera de Windows Retro", description: "Cuando el rival activa una trampa, lo infecta: pierde 300 LP al inicio de cada uno de sus turnos.", renderFile: "trap-windows-flag-infect", faction: "BIG_TECH", cost: 2, trigger: "ON_OPPONENT_TRAP_ACTIVATED", effect: { action: "APPLY_DAMAGE_OVER_TIME", value: 300 } }),
  createTrap({ id: "trap-hugging-heal", name: "Abrazo de Hugging Face", description: "Cuando el rival activa una trampa, recuperas 300 LP al inicio de cada uno de tus turnos.", renderFile: "trap-hugging-heal", faction: "OPEN_SOURCE", cost: 2, trigger: "ON_OPPONENT_TRAP_ACTIVATED", effect: { action: "APPLY_HEAL_OVER_TIME", value: 300 } }),
  createTrap({ id: "trap-flutter-reflect", name: "Flutter Enjambre", description: "Cuando el rival te ataca directo, anula el golpe y refleja el ATK del atacante a sus LP.", renderFile: "trap-flutter-reflect", faction: "OPEN_SOURCE", cost: 3, trigger: "ON_OPPONENT_DIRECT_ATTACK_DECLARED", effect: { action: "REFLECT_DIRECT_DAMAGE" } }),
  createTrap({ id: "trap-escudo-metasploit", name: "Escudo Metasploit", description: "Cuando el rival declara un ataque, lo bloquea (sin destruir al atacante).", renderFile: "trap-escudo-metasploit", faction: "OPEN_SOURCE", cost: 2, trigger: "ON_OPPONENT_ATTACK_DECLARED", effect: { action: "NEGATE_ATTACK" } }),
  createTrap({ id: "trap-openclaw-nullify-buff", name: "OpenClaw Bug Trap", description: "Cuando el rival buffea sus entities, resta ese mismo valor a las entities buffeadas.", renderFile: "trap-openclaw-nullify-buff", faction: "OPEN_SOURCE", cost: 2, trigger: "ON_OPPONENT_STAT_BUFF_APPLIED", effect: { action: "NULLIFY_OPPONENT_BUFF" } }),
  createTrap({ id: "trap-firewall-counter-magic", name: "Escudo Firewall", description: "Cuando el rival activa una magia, anula su efecto y destruye esa carta.", renderFile: "trap-firewall-counter-magic", faction: "OPEN_SOURCE", cost: 3, trigger: "ON_OPPONENT_EXECUTION_ACTIVATED", effect: { action: "NEGATE_OPPONENT_EXECUTION_AND_DESTROY" } }),
  createTrap({ id: "trap-typescript-shield", name: "Escudo de Tipos TypeScript", description: "Cuando atacan a una de tus TypeScript, TODAS tus TypeScript ganan 1000 DEF (acumulable). La trampa sigue puesta.", renderFile: "trap-typescript-shield", faction: "OPEN_SOURCE", cost: 2, trigger: "ON_OPPONENT_ATTACK_DECLARED", effect: { action: "REINFORCE_LINKED_ENTITY_ON_ATTACK", linkedCardId: "entity-typescript", value: 1000 } }),
];

