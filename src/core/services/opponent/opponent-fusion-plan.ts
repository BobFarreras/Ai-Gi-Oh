// src/core/services/opponent/opponent-fusion-plan.ts - Planifica jugadas de preparación de fusión para el bot sin depender de dificultad.
import { ICard } from "@/core/entities/ICard";
import { IPlayer } from "@/core/entities/IPlayer";
import { IOpponentPlayDecision } from "@/core/services/opponent/types";
import { IPlayableCardDecision } from "@/core/services/opponent/select-opponent-play";
import { resolveFusionMaterialGaps, workingFusionRecipeIds } from "@/core/services/opponent/opponent-fusion-execution";
import { chooseFusionMaterialsByRecipeId } from "@/core/services/opponent/heuristic-fusion-materials";
import { GameState } from "@/core/use-cases/GameEngine";
import { IBoardEntity } from "@/core/entities/IPlayer";
import { getPlayerFusionRecipe } from "@/core/use-cases/game-engine/fusion/fusion-recipes";

/** Mayor ATK entre los rivales EN ATAQUE: la amenaza que mataría a un material recién invocado. */
function rivalAttackThreat(target: IPlayer): number {
  return target.activeEntities.reduce((best, entity) => (entity.mode === "ATTACK" ? Math.max(best, entity.card.attack ?? 0) : best), 0);
}

/** ¿Ya hay algún material de la receta en mesa? (fusión ya empezada = no abortar a mitad). */
function hasStartedRecipe(opponent: IPlayer, recipeId: string): boolean {
  const recipe = getPlayerFusionRecipe(opponent, recipeId);
  if (!recipe) return false;
  return opponent.activeEntities.some((entity) =>
    Boolean(recipe.requiredMaterialIds?.includes(entity.card.id)) ||
    Boolean(entity.card.archetype && recipe.requiredArchetypes?.includes(entity.card.archetype)));
}

function matchesFusionMaterialGap(card: ICard, recipeId: string, opponent: IPlayer): boolean {
  if (card.type !== "ENTITY") return false;
  const gaps = resolveFusionMaterialGaps(opponent, recipeId);
  if (gaps.missingCardIds.includes(card.id)) return true;
  return Boolean(card.archetype && gaps.missingArchetypes.includes(card.archetype));
}

function findFusionExecutionSetupCard(playable: IPlayableCardDecision[]): IPlayableCardDecision | null {
  return playable.find((decision) =>
    decision.card.type === "EXECUTION" &&
    decision.card.effect?.action === "FUSION_SUMMON" &&
    decision.mode === "SET") ?? null;
}

function scoreEntitySacrifice(entity: IBoardEntity): number {
  return (entity.card.attack ?? 0) + (entity.card.defense ?? 0) + entity.card.cost * 100;
}

function isRecipeProtectedMaterial(entity: IBoardEntity, recipeId: string, opponent: IPlayer): boolean {
  const recipe = getPlayerFusionRecipe(opponent, recipeId);
  if (!recipe) return false;
  if (recipe.requiredMaterialIds?.includes(entity.card.id)) return true;
  return Boolean(entity.card.archetype && recipe.requiredArchetypes?.includes(entity.card.archetype));
}

function chooseEntityToReplace(opponent: IPlayer, recipeId: string): string | null {
  const removable = opponent.activeEntities.filter((entity) => !isRecipeProtectedMaterial(entity, recipeId, opponent));
  const candidates = removable.length > 0 ? removable : opponent.activeEntities;
  if (candidates.length === 0) return null;
  return candidates.reduce((worst, current) =>
    scoreEntitySacrifice(current) < scoreEntitySacrifice(worst) ? current : worst).instanceId;
}

function scoreExecutionSacrifice(entity: IBoardEntity): number {
  const card = entity.card;
  const triggerBonus = card.type === "TRAP" && card.trigger ? 450 : 0;
  const fusionBonus = card.type === "EXECUTION" && card.effect?.action === "FUSION_SUMMON" ? 400 : 0;
  const modePenalty = entity.mode === "ACTIVATE" ? 10_000 : 0;
  return (card.cost * 120) + triggerBonus + fusionBonus + modePenalty;
}

function chooseExecutionToReplace(opponent: IPlayer): string | null {
  const candidates = opponent.activeExecutions.filter((entity) => entity.mode !== "ACTIVATE");
  if (candidates.length === 0) return null;
  return candidates.reduce((worst, current) =>
    scoreExecutionSacrifice(current) < scoreExecutionSacrifice(worst) ? current : worst).instanceId;
}

/** Amenaza rival total en ATAQUE: si casi te mata, no te puedes permitir ahorrar/esperar. */
function lethalPressure(opponent: IPlayer, target: IPlayer): boolean {
  const totalAttack = target.activeEntities
    .filter((entity) => entity.mode === "ATTACK")
    .reduce((sum, entity) => sum + (entity.card.attack ?? 0), 0);
  return totalAttack >= opponent.healthPoints;
}

/**
 * ¿Conviene NO gastar energía este turno para poder activar una fusión ya lista? Caso del usuario: tienes el
 * par en mesa y el ejecutable en mano, pero te faltan un par de puntos de energía; mejor esperar sin gastar y
 * activarla el turno siguiente que malgastar la energía (y acabar descartando el ejecutable por límite de mano).
 * Universal (todos los tiers) porque la fusión es un pilar. No aplica si el rival te puede matar ya.
 */
export function shouldHoldEnergyForFusion(opponent: IPlayer, target: IPlayer): boolean {
  if (lethalPressure(opponent, target)) return false;
  for (const recipeId of workingFusionRecipeIds(opponent)) {
    const ready = chooseFusionMaterialsByRecipeId(opponent.activeEntities, recipeId, opponent.fusionDeck) !== null;
    if (!ready) continue;
    const execInHand = opponent.hand.find(
      (card) => card.type === "EXECUTION" && card.effect?.action === "FUSION_SUMMON" && card.effect.recipeId === recipeId,
    );
    // Par listo + ejecutable en mano pero sin energía suficiente para activarlo → banca energía (pasa el turno).
    // Si el ejecutable ya está SET en mesa, reactivarlo es GRATIS: no hay que esperar (se activa solo).
    if (execInHand && execInHand.cost > opponent.currentEnergy) return true;
  }
  return false;
}

/**
 * Prioriza jugadas de setup de materiales/ejecución para completar fusión en turnos siguientes.
 */
export function chooseFusionSetupPlay(state: GameState, opponent: IPlayer, target: IPlayer, playable: IPlayableCardDecision[]): IOpponentPlayDecision | null {
  // Recetas hacia las que trabaja la IA: el ejecutable FUSION_SUMMON en MANO **o ya SET en el tablero** (combo B),
  // con la carta resultado en el fusionDeck. Antes solo miraba la mano: en cuanto seteaba la exec, se quedaba
  // ciego y dejaba de invocar materiales (bug: 0 fusiones aunque tuviera las piezas).
  const recipeIds = workingFusionRecipeIds(opponent);
  if (recipeIds.length === 0) return null;
  const threat = rivalAttackThreat(target);

  if (!state.hasNormalSummonedThisTurn) {
    for (const recipeId of recipeIds) {
      // Par ya en mesa: la activación la resuelve el loop (exec en mano→ACTIVATE) o findActivatableSetExecution.
      if (chooseFusionMaterialsByRecipeId(opponent.activeEntities, recipeId, opponent.fusionDeck) !== null) continue;
      // Materiales de la receta disponibles en mano, el de MÁS DEFENSA primero: será el ANCLA que aguante en mesa
      // el turno rival mientras esperamos al 2º material (petición del usuario: "un material fuerte en el tablero").
      const materialPlays = playable
        .filter((decision) => matchesFusionMaterialGap(decision.card, recipeId, opponent))
        .sort((a, b) => (b.card.defense ?? 0) - (a.card.defense ?? 0));
      if (materialPlays.length === 0) continue;
      const chosen = materialPlays[0];
      // Si aún NO hay material de la receta en mesa, el ancla debe sobrevivir un turno rival; si no aguanta,
      // esperar (no arrancar una fusión inviable regala la partida: mazos de fusión perdían el 100%). Si ya hay
      // ancla, invocar el que falta COMPLETA el par (se consume al activar → exposición nula).
      if (!hasStartedRecipe(opponent, recipeId)) {
        const anchorSurvives = (chosen.card.defense ?? 0) >= threat;
        if (threat > 0 && !anchorSurvives) continue;
      }
      // Los materiales se invocan en DEFENSA: hay que conservarlos, no lanzarlos a atacar (su modo no afecta a la
      // fusión, se consumen al activar el ejecutable).
      if (opponent.activeEntities.length < 3) return { cardId: chosen.card.id, mode: "DEFENSE" };
      const replaceEntityInstanceId = chooseEntityToReplace(opponent, recipeId);
      if (replaceEntityInstanceId) return { cardId: chosen.card.id, mode: "DEFENSE", replaceEntityInstanceId };
    }
  }

  // Sin material que invocar ahora: armar la exec por adelantado (combo B) si sigue en mano, para que luego
  // baste invocar el 2º material y reactivarla gratis.
  const setupExecution = findFusionExecutionSetupCard(playable);
  if (!setupExecution) return null;
  if (opponent.activeExecutions.length >= 3) {
    const replaceExecutionInstanceId = chooseExecutionToReplace(opponent);
    if (!replaceExecutionInstanceId) return null;
    return { cardId: setupExecution.card.id, mode: "SET", replaceExecutionInstanceId };
  }
  return { cardId: setupExecution.card.id, mode: "SET" };
}
