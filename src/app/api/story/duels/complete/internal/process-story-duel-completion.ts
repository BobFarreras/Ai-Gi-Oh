// src/app/api/story/duels/complete/internal/process-story-duel-completion.ts - Orquesta cierre de duelo Story y cálculo de recompensas de primera victoria.
import { ICard } from "@/core/entities/ICard";
import { IStoryDuelDefinition } from "@/core/entities/opponent/IStoryDuelDefinition";
import { ValidationError } from "@/core/errors/ValidationError";
import { IMatchReward } from "@/core/entities/match/IMatchReward";
import { ICardCollectionRepository } from "@/core/repositories/ICardCollectionRepository";
import { IOpponentRepository } from "@/core/repositories/IOpponentRepository";
import { IPlayerProgressRepository } from "@/core/repositories/IPlayerProgressRepository";
import { IPlayerStoryDuelProgressRepository } from "@/core/repositories/IPlayerStoryDuelProgressRepository";
import { IPlayerStoryWorldRepository } from "@/core/repositories/IPlayerStoryWorldRepository";
import { ISkillTreeRepository } from "@/core/repositories/ISkillTreeRepository";
import { IWalletRepository } from "@/core/repositories/IWalletRepository";
import { GetOrCreatePlayerProgressUseCase } from "@/core/use-cases/player/GetOrCreatePlayerProgressUseCase";
import { GetPlayerSkillModifiersUseCase } from "@/core/use-cases/progression/GetPlayerSkillModifiersUseCase";
import { applySkillEconomyToReward } from "@/core/services/match/rewards/apply-skill-economy-to-reward";
import { resolveStoryDuelCompletionInput } from "@/services/story/duel-flow/resolve-story-duel-completion-input";
import { didWinFromStoryOutcome } from "@/services/story/duel-flow/story-duel-outcome";
import { resolveStoryRewardCards } from "@/services/story/resolve-story-reward-cards";
import { resolveStoryDuelReturnNode } from "@/app/api/story/duels/complete/internal/resolve-story-duel-return-node";
import { buildOverworldTilemap, isKnownOverworldMap } from "@/services/story/overworld/resolve-overworld-tilemap";
import { STORY_DEFEAT_NEXUS_PENALTY } from "@/services/story/duel-flow/story-defeat-penalty";
import { CreditPassiveNexusFn, creditPassiveNexus, parsePassiveNexusClaim } from "@/services/progression/credit-passive-nexus";

interface IProcessStoryDuelCompletionParams {
  playerId: string;
  payload: Record<string, unknown>;
  opponentRepository: IOpponentRepository;
  storyProgressRepository: IPlayerStoryDuelProgressRepository;
  storyWorldRepository: IPlayerStoryWorldRepository;
  playerProgressRepository: IPlayerProgressRepository;
  walletRepository: IWalletRepository;
  collectionRepository: ICardCollectionRepository;
  loadCardsByIds: (cardIds: string[]) => Promise<Map<string, ICard>>;
  /** Árbol de habilidades (ficha 8): aplica los modificadores de economía a la recompensa (no-fatal). */
  skillTreeRepository?: ISkillTreeRepository;
  /** Inyectable en tests; por defecto la acreditación real vía RPC service-role. */
  creditPassiveNexus?: CreditPassiveNexusFn;
}

/**
 * Aplica la economía del árbol a la recompensa de Story (solo en primera victoria → outcome WIN). NO-FATAL: sin
 * árbol o ante un fallo (tablas sin migrar), devuelve la base — el cierre del duelo nunca se rompe por el árbol.
 */
async function applyStoryEconomy(params: IProcessStoryDuelCompletionParams, base: IMatchReward): Promise<IMatchReward> {
  if (!params.skillTreeRepository || (base.nexus <= 0 && base.playerExperience <= 0)) return base;
  try {
    const modifiers = await new GetPlayerSkillModifiersUseCase(params.skillTreeRepository).execute(params.playerId);
    return applySkillEconomyToReward({ base, economy: modifiers.economy, outcome: "WIN" });
  } catch {
    return base;
  }
}

function mapRewardCards(cardsById: Map<string, ICard>, rewardCardIds: string[]): ICard[] {
  return rewardCardIds.flatMap((cardId) => {
    const card = cardsById.get(cardId);
    return card ? [{ ...card }] : [];
  });
}

function resolveBossRepeatRewardCardIds(duel: IStoryDuelDefinition): string[] {
  const guaranteedRewards = duel.rewardCards.filter((entry) => entry.isGuaranteed);
  if (guaranteedRewards.length > 0) {
    return guaranteedRewards.flatMap((entry) =>
      Array.from({ length: Math.max(1, entry.copies) }, () => entry.cardId),
    );
  }
  const fallbackReward = duel.rewardCards[0];
  if (!fallbackReward) return [];
  return [fallbackReward.cardId];
}

/**
 * Penaliza la derrota/abandono de un duelo Story restando Nexus. Se limita al saldo disponible
 * (nunca deja el monedero en negativo ni lanza si el jugador tiene menos que la penalización).
 * Devuelve cuánto se restó realmente para que el cliente lo muestre.
 */
async function penalizeDefeatNexus(
  playerId: string,
  walletRepository: IWalletRepository,
): Promise<number> {
  const wallet = await walletRepository.getWallet(playerId).catch(() => null);
  if (!wallet) return 0;
  const penalty = Math.min(STORY_DEFEAT_NEXUS_PENALTY, Math.max(0, wallet.nexus));
  if (penalty <= 0) return 0;
  await walletRepository.debitNexus(playerId, penalty).catch(() => undefined);
  return penalty;
}

/**
 * Al perder o abandonar un duelo lanzado desde el overworld, el jugador reaparece al INICIO
 * del acto: reseteamos la posición guardada al spawn del mapa activo (server-authoritative,
 * no depende de que el retorno del cliente arrastre el resultado). Sin overworld activo, no hace nada.
 */
async function resetOverworldToActStart(
  playerId: string,
  storyWorldRepository: IPlayerStoryWorldRepository,
): Promise<void> {
  const state = await storyWorldRepository
    .getOverworldStateByPlayerId(playerId)
    .catch(() => ({ mapId: null, position: null }));
  if (!state.mapId || !isKnownOverworldMap(state.mapId)) return;
  const spawn = buildOverworldTilemap(state.mapId)?.spawns[0];
  if (!spawn) return;
  await storyWorldRepository.saveOverworldState(playerId, {
    mapId: state.mapId,
    position: { tileX: spawn.tileX, tileY: spawn.tileY },
  });
}

async function resolveDuelFromPayload(payload: Record<string, unknown>, opponentRepository: IOpponentRepository): Promise<IStoryDuelDefinition> {
  const input = resolveStoryDuelCompletionInput(payload);
  if (!input) throw new ValidationError("El resultado del duelo Story es inválido.");
  const duel = await opponentRepository.getStoryDuel(input.chapter, input.duelIndex);
  if (!duel) throw new ValidationError("No se encontró el duelo Story solicitado.");
  return duel;
}

/**
 * Ejecuta el flujo completo de cierre de duelo Story devolviendo payload listo para respuesta HTTP.
 */
export async function processStoryDuelCompletion(params: IProcessStoryDuelCompletionParams): Promise<Record<string, unknown>> {
  const input = resolveStoryDuelCompletionInput(params.payload);
  if (!input) throw new ValidationError("El resultado del duelo Story es inválido.");
  const didWin = didWinFromStoryOutcome(input.outcome);
  // Derrota/abandono en el overworld: reaparecer al inicio del acto. Se hace ANTES del lookup del
  // duelo para que un fallo al resolverlo no impida el reset (evita el bucle de re-entrar al haz).
  // Además penalizamos el Nexus (solo en Story), también antes del lookup por el mismo motivo.
  let penaltyNexus = 0;
  if (!didWin) {
    await resetOverworldToActStart(params.playerId, params.storyWorldRepository);
    penaltyNexus = await penalizeDefeatNexus(params.playerId, params.walletRepository);
  }
  // Recaudación (ficha 3): paga en duelos TERMINADOS (ganados o perdidos), nunca al abandonar. La RPC
  // aplica idempotencia y topes (600/duelo, 1200/día); aquí solo validamos la forma del reporte.
  const passiveClaim = input.outcome === "ABANDONED" ? null : parsePassiveNexusClaim(params.payload);
  const passiveNexusCredited = await (params.creditPassiveNexus ?? creditPassiveNexus)(params.playerId, passiveClaim);
  const duel = await resolveDuelFromPayload(params.payload, params.opponentRepository);
  const duelProgress = await params.storyProgressRepository.registerDuelResult(params.playerId, duel.id, didWin);
  const firstVictory = didWin
    && duelProgress.firstClearedAtIso !== null
    && duelProgress.lastPlayedAtIso !== null
    && duelProgress.firstClearedAtIso === duelProgress.lastPlayedAtIso;
  const shouldGrantStandardRewards = firstVictory;
  const shouldGrantBossRepeatCardReward = didWin && duel.isBossDuel && !firstVictory;
  const returnNodeId = await resolveStoryDuelReturnNode({
    playerId: params.playerId,
    duelNodeId: duel.id,
    didWin,
    opponentRepository: params.opponentRepository,
    storyProgressRepository: params.storyProgressRepository,
    storyWorldRepository: params.storyWorldRepository,
  });
  if (!shouldGrantStandardRewards && !shouldGrantBossRepeatCardReward) {
    return { duelProgress, rewarded: false, rewardNexus: 0, rewardPlayerExperience: 0, rewardCardIds: [], rewardCards: [], penaltyNexus, passiveNexusCredited, outcome: input.outcome, duelNodeId: duel.id, returnNodeId };
  }
  const rewardCardIds = shouldGrantBossRepeatCardReward
    ? resolveBossRepeatRewardCardIds(duel)
    : resolveStoryRewardCards(duel.rewardCards);
  const baseReward = {
    nexus: shouldGrantStandardRewards ? duel.rewardNexus : 0,
    playerExperience: shouldGrantStandardRewards ? duel.rewardPlayerExperience : 0,
  };
  const adjustedReward = await applyStoryEconomy(params, baseReward);
  const rewardNexus = adjustedReward.nexus;
  const rewardPlayerExperience = adjustedReward.playerExperience;
  if (rewardNexus > 0) await params.walletRepository.creditNexus(params.playerId, rewardNexus);
  if (rewardCardIds.length > 0) await params.collectionRepository.addCards(params.playerId, rewardCardIds);
  const cardsById = rewardCardIds.length > 0 ? await params.loadCardsByIds(rewardCardIds) : new Map<string, ICard>();
  const rewardCards = mapRewardCards(cardsById, rewardCardIds);
  const playerProgress = rewardPlayerExperience > 0
    ? await (async () => {
        const progressUseCase = new GetOrCreatePlayerProgressUseCase(params.playerProgressRepository);
        const currentPlayerProgress = await progressUseCase.execute({ playerId: params.playerId });
        return params.playerProgressRepository.update({
          playerId: params.playerId,
          playerExperience: currentPlayerProgress.playerExperience + rewardPlayerExperience,
        });
      })()
    : null;
  return {
    duelProgress,
    rewarded: true,
    rewardNexus,
    rewardPlayerExperience,
    rewardCardIds,
    rewardCards,
    penaltyNexus,
    passiveNexusCredited,
    ...(playerProgress ? { playerProgress } : {}),
    outcome: input.outcome,
    duelNodeId: duel.id,
    returnNodeId,
  };
}
