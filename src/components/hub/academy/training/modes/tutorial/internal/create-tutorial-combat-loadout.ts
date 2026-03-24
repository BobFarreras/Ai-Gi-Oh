// src/components/hub/academy/training/modes/tutorial/internal/create-tutorial-combat-loadout.ts - Define mazos mock del tutorial de combate con orden estable para flujo guiado.
import { ICard } from "@/core/entities/ICard";
import { CARD_BY_ID } from "@/infrastructure/repositories/internal/card-catalog";

export interface ITutorialCombatLoadout {
  playerDeck: ICard[];
  playerFusionDeck: ICard[];
  opponentDeck: ICard[];
  opponentFusionDeck: ICard[];
  seed: string;
}

function resolveCard(cardId: string): ICard {
  const card = CARD_BY_ID.get(cardId);
  if (!card) throw new Error(`Carta no disponible para tutorial de combate: ${cardId}`);
  return { ...card };
}

function createTutorialTrapAttackDrain200(): ICard {
  return {
    id: "tutorial-trap-attack-drain-200",
    name: "Firewall Adaptativo",
    description: "Cuando te atacan, reduce 200 ATQ a la entidad atacante.",
    type: "TRAP",
    faction: "OPEN_SOURCE",
    cost: 2,
    trigger: "ON_OPPONENT_ATTACK_DECLARED",
    effect: { action: "REDUCE_OPPONENT_ATTACK", value: 200 },
    bgUrl: "/assets/bgs/bg-tech.jpg",
    renderUrl: "/assets/renders/openclaw.png",
  };
}

function createTutorialEnergyRestoreExecution(): ICard {
  return {
    id: "tutorial-exec-energy-restore",
    name: "Recarga de Núcleo",
    description: "Restaura toda tu energía para continuar el combo del turno.",
    type: "EXECUTION",
    faction: "BIG_TECH",
    cost: 1,
    effect: { action: "RESTORE_ENERGY" },
    bgUrl: "/assets/bgs/bg-tech.jpg",
    renderUrl: "/assets/renders/supabase.png",
  };
}

function createOpponentEnergyRestoreExecution(): ICard {
  return {
    id: "tutorial-opp-exec-energy-restore",
    name: "Núcleo Overclock",
    description: "Recupera toda la energía del rival para mantener su plan de turno.",
    type: "EXECUTION",
    faction: "NO_CODE",
    cost: 1,
    effect: { action: "RESTORE_ENERGY" },
    bgUrl: "/assets/bgs/bg-tech.jpg",
    renderUrl: "/assets/renders/kali-linux.png",
  };
}

function createOpponentCard(id: string, name: string, attack: number, defense: number): ICard {
  return {
    id,
    name,
    description: `Unidad de entrenamiento ${name}.`,
    type: "ENTITY",
    faction: "NO_CODE",
    cost: 4,
    attack,
    defense,
    archetype: "TOOL",
    bgUrl: "/assets/bgs/bg-tech.jpg",
    renderUrl: "/assets/renders/n8n.png",
  };
}

/**
 * Orden fijo para que mano y robos sigan un guion didáctico reproducible.
 */
export function createTutorialCombatLoadout(): ITutorialCombatLoadout {
  const playerDeck: ICard[] = [
    resolveCard("entity-chatgpt"),
    resolveCard("exec-boost-atk-400"),
    createTutorialTrapAttackDrain200(),
    createTutorialEnergyRestoreExecution(),
    resolveCard("entity-gemini"),
    resolveCard("exec-fusion-gemgpt"),
    resolveCard("entity-python"),
    resolveCard("entity-react"),
    resolveCard("entity-nextjs"),
    resolveCard("exec-heal-700"),
    resolveCard("entity-chatgpt"),
    resolveCard("entity-gemini"),
    resolveCard("entity-vscode"),
    resolveCard("entity-git"),
    resolveCard("exec-boost-atk-400"),
    resolveCard("entity-react"),
    resolveCard("entity-nextjs"),
    resolveCard("entity-vscode"),
    resolveCard("entity-git"),
    resolveCard("exec-draw-1"),
  ];
  const opponentDeck: ICard[] = [
    createOpponentCard("tutorial-opp-assault-alpha", "Assault Alpha", 2350, 1200),
    createOpponentCard("tutorial-opp-crusher-beta", "Crusher Beta", 2600, 1400),
    createOpponentCard("tutorial-opp-guard-gamma", "Guard Gamma", 1900, 2400),
    createOpponentEnergyRestoreExecution(),
    {
      id: "tutorial-opp-shock-trap",
      name: "Shock Mirror",
      description: "Cuando el rival declara ataque, inflige 1000 de daño directo.",
      type: "TRAP",
      faction: "NO_CODE",
      cost: 3,
      trigger: "ON_OPPONENT_ATTACK_DECLARED",
      effect: { action: "DAMAGE", target: "OPPONENT", value: 1000 },
      bgUrl: "/assets/bgs/bg-tech.jpg",
      renderUrl: "/assets/renders/kali-linux.png",
    },
    resolveCard("entity-vscode"),
    resolveCard("entity-git"),
    resolveCard("entity-react"),
    resolveCard("entity-nextjs"),
    resolveCard("exec-boost-atk-400"),
    resolveCard("exec-direct-damage-600"),
    resolveCard("entity-vscode"),
    resolveCard("entity-git"),
    resolveCard("entity-react"),
    resolveCard("entity-nextjs"),
    resolveCard("exec-boost-atk-400"),
    resolveCard("exec-direct-damage-900"),
    resolveCard("entity-vscode"),
    resolveCard("entity-git"),
    resolveCard("entity-react"),
    resolveCard("entity-nextjs"),
  ];
  return {
    playerDeck,
    playerFusionDeck: [resolveCard("fusion-gemgpt")],
    opponentDeck,
    opponentFusionDeck: [resolveCard("fusion-pytgress")],
    seed: "tutorial-combat-seed-v3",
  };
}
