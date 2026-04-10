// src/core/use-cases/game-engine/actions/internal/execution-effects.ts - Aplica efectos de ejecución usando registry tipado para facilitar extensiones seguras.
import { ICardEffect } from "@/core/entities/ICard";
import { IPlayer } from "@/core/entities/IPlayer";
import { IExecutionSystemEvent } from "@/core/use-cases/game-engine/actions/internal/execution-return-effects";
import { resolveExecutionEffectFromRegistry } from "@/core/use-cases/game-engine/actions/internal/execution-effect-registry";

interface IBuffSummary {
  entityIds: string[];
  stat: "ATTACK" | "DEFENSE" | null;
  amount: number;
}

export interface IExecutionEffectResult {
  player: IPlayer;
  opponent: IPlayer;
  healApplied: number;
  energyRecovered: number;
  energyDrainedTargetPlayerId: string | null;
  energyDrainedAmount: number;
  buff: IBuffSummary;
  damageTargetPlayerId: string | null;
  damageAmount: number;
  systemEvents: IExecutionSystemEvent[];
}

function createNeutralResult(player: IPlayer, opponent: IPlayer): IExecutionEffectResult {
  return {
    player,
    opponent,
    healApplied: 0,
    energyRecovered: 0,
    energyDrainedTargetPlayerId: null,
    energyDrainedAmount: 0,
    buff: { entityIds: [], stat: null, amount: 0 },
    damageTargetPlayerId: null,
    damageAmount: 0,
    systemEvents: [],
  };
}

export function applyExecutionEffect(player: IPlayer, opponent: IPlayer, effect: ICardEffect): IExecutionEffectResult {
  return resolveExecutionEffectFromRegistry(player, opponent, effect) ?? createNeutralResult(player, opponent);
}
