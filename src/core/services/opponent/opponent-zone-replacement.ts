// src/core/services/opponent/opponent-zone-replacement.ts - Ficha 5 fase 3: con la zona LLENA (3 entities o
// 3 magias/trampas) y sin fusión en curso, la IA no sabía rotar cartas y desperdiciaba jugadas mejores. Aquí
// decide si la carta nueva merece SUSTITUIR a la peor ya puesta, con un margen para no cambiar por nimiedades.
import { ICard } from "@/core/entities/ICard";
import { IBoardEntity, IPlayer } from "@/core/entities/IPlayer";

/** Margen mínimo para reemplazar: la nueva debe superar a la peor con holgura (evita churn sin ganancia). */
const ENTITY_REPLACE_MARGIN = 600;
const EXECUTION_REPLACE_MARGIN = 500;

/** Valor de tablero de una entity (cuerpo + coste): sirve tanto para cartas en mano como en mesa. */
function entityBoardValue(card: ICard): number {
  return (card.attack ?? 0) + (card.defense ?? 0) + card.cost * 100;
}

/** Valor de una magia/trampa puesta: coste + bonus por trampa reactiva. Una activándose no se toca. */
function executionBoardValue(card: ICard): number {
  const triggerBonus = card.type === "TRAP" && card.trigger ? 450 : 0;
  const effectValue = card.effect && "value" in card.effect && typeof card.effect.value === "number" ? card.effect.value : 0;
  return card.cost * 120 + triggerBonus + effectValue;
}

/** La peor entity propia por valor de tablero (la candidata a ser sustituida). */
function worstEntity(entities: readonly IBoardEntity[]): IBoardEntity | null {
  if (entities.length === 0) return null;
  return entities.reduce((worst, current) => (entityBoardValue(current.card) < entityBoardValue(worst.card) ? current : worst));
}

/** La peor magia/trampa propia por valor; NUNCA una en modo ACTIVATE (está resolviéndose). */
function worstExecution(executions: readonly IBoardEntity[]): IBoardEntity | null {
  const candidates = executions.filter((entity) => entity.mode !== "ACTIVATE");
  if (candidates.length === 0) return null;
  return candidates.reduce((worst, current) => (executionBoardValue(current.card) < executionBoardValue(worst.card) ? current : worst));
}

/**
 * Con la zona de ENTITIES llena, devuelve el instanceId a reemplazar si `card` supera a la peor puesta por
 * encima del margen; null si no compensa (se mantiene lo que hay).
 */
export function chooseEntityZoneReplacement(opponent: IPlayer, card: ICard): string | null {
  if (opponent.activeEntities.length < 3) return null;
  const worst = worstEntity(opponent.activeEntities);
  if (!worst) return null;
  return entityBoardValue(card) >= entityBoardValue(worst.card) + ENTITY_REPLACE_MARGIN ? worst.instanceId : null;
}

/** Igual para la zona de magias/trampas. */
export function chooseExecutionZoneReplacement(opponent: IPlayer, card: ICard): string | null {
  if (opponent.activeExecutions.length < 3) return null;
  const worst = worstExecution(opponent.activeExecutions);
  if (!worst) return null;
  return executionBoardValue(card) >= executionBoardValue(worst.card) + EXECUTION_REPLACE_MARGIN ? worst.instanceId : null;
}
