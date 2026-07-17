// src/core/services/opponent/opponent-tactical-context.ts - Utilidades tácticas para decidir presión, protección y tempo en la IA rival.
import { ICard } from "@/core/entities/ICard";
import { IPlayer } from "@/core/entities/IPlayer";
import { IOpponentDifficultyProfile } from "@/core/services/opponent/difficulty/types";
import { IStoryAiProfile } from "@/core/services/opponent/difficulty/story-ai-profile";

function rivalBestAttack(target: IPlayer): number {
  return target.activeEntities.reduce((best, entity) => Math.max(best, entity.card.attack ?? 0), 0);
}

function hasSetTargets(target: IPlayer): boolean {
  return target.activeEntities.some((entity) => entity.mode === "SET");
}

function isProtectionTrap(card: ICard): boolean {
  if (card.type !== "TRAP") return false;
  return card.trigger === "ON_OPPONENT_ATTACK_DECLARED" || card.trigger === "ON_OPPONENT_DIRECT_ATTACK_DECLARED";
}

function hasProtectionInHand(opponent: IPlayer): boolean {
  return opponent.hand.some((card) => isProtectionTrap(card));
}

function isDefensiveExecution(card: ICard): boolean {
  if (card.type !== "EXECUTION" || !card.effect) return false;
  return card.effect.action === "BOOST_DEFENSE_BY_ARCHETYPE" || card.effect.action === "BOOST_DEFENSE_BY_CARD_ID" || card.effect.action === "SET_DEFENSE_BY_CARD_ID";
}

function hasTrapAlreadySet(opponent: IPlayer): boolean {
  return opponent.activeExecutions.some((entity) => entity.card.type === "TRAP");
}

/** Trampa reactiva armada que SOLO salta con un ataque directo (Flutter Enjambre: REFLECT_DIRECT_DAMAGE). */
function hasArmedDirectOnlyTrap(opponent: IPlayer): boolean {
  return opponent.activeExecutions.some(
    (entity) =>
      entity.card.type === "TRAP" &&
      entity.mode === "SET" &&
      entity.card.trigger === "ON_OPPONENT_DIRECT_ATTACK_DECLARED" &&
      entity.card.effect?.action === "REFLECT_DIRECT_DAMAGE",
  );
}

/** El rival tiene con qué atacar directo (entity en ATAQUE con ATK útil). */
function rivalCanAttackDirect(target: IPlayer): boolean {
  return target.activeEntities.some((entity) => entity.mode === "ATTACK" && (entity.card.attack ?? 0) > 0);
}

/**
 * Ficha 5 fase 5 (2º caso del usuario): NO invocar todavía para cebar una trampa reactiva de ataque-directo.
 * Si tienes una Flutter Enjambre armada, el tablero propio vacío y el rival puede atacar directo, invocar
 * una entity bloquearía ese ataque y la trampa nunca saltaría. Retrasar el desarrollo un turno maximiza la
 * trampa (y una entity recién invocada no podría atacar este turno igualmente, así que el coste es mínimo).
 */
export function shouldHoldToBaitReactiveTrap(input: {
  card: ICard;
  mode: "ATTACK" | "DEFENSE" | "SET" | "ACTIVATE";
  opponent: IPlayer;
  target: IPlayer;
}): boolean {
  if (input.card.type !== "ENTITY") return false; // fusión es swing raro y valioso: no la frenamos por el cebo
  if (input.mode !== "ATTACK" && input.mode !== "DEFENSE") return false; // solo invocaciones rompen el cebo
  if (input.opponent.activeEntities.length !== 0) return false; // con tablero ya poblado el rival no ataca directo
  if (!hasArmedDirectOnlyTrap(input.opponent)) return false;
  return rivalCanAttackDirect(input.target);
}

/**
 * Decide si conviene esperar antes de exponer un atacante frágil en mesa.
 */
export function shouldHoldFragileFrontline(input: {
  card: ICard;
  mode: "ATTACK" | "DEFENSE" | "SET" | "ACTIVATE";
  opponent: IPlayer;
  target: IPlayer;
  profile: IOpponentDifficultyProfile;
  aiProfile: IStoryAiProfile;
}): boolean {
  if (input.card.type !== "ENTITY" && input.card.type !== "FUSION") return false;
  // Aguantar aplica tanto si el frágil iría en ATAQUE como en DEFENSA (ficha 5 fase 2: ahora los frágiles se
  // invocan en defensa): en ambos casos, si hay una trampa protectora en mano, es mejor prepararla primero.
  if (input.mode !== "ATTACK" && input.mode !== "DEFENSE") return false;
  if (input.profile.key === "EASY" || input.profile.key === "NORMAL") return false;
  const bestThreat = rivalBestAttack(input.target);
  const attack = input.card.attack ?? 0;
  const defense = input.card.defense ?? 0;
  const fragile = bestThreat >= Math.max(attack, defense) + 150;
  if (!fragile) return false;
  const cautiousStyle = input.aiProfile.style === "control" || input.aiProfile.aggression < 0.52;
  if (!cautiousStyle) return false;
  const canPrepareProtection = hasProtectionInHand(input.opponent) || input.opponent.hand.some((card) => isDefensiveExecution(card));
  return canPrepareProtection && input.opponent.activeEntities.length === 0;
}

/**
 * Ajuste de score por contexto táctico para evitar decisiones planas.
 */
export function resolveTacticalCardBonus(input: {
  card: ICard;
  mode: "ATTACK" | "DEFENSE" | "SET" | "ACTIVATE";
  opponent: IPlayer;
  target: IPlayer;
  aiProfile: IStoryAiProfile;
}): number {
  if (input.card.type === "TRAP") {
    const pressure = input.target.activeEntities.length > 0 ? 320 : 0;
    const protectionNeed = input.opponent.healthPoints <= Math.floor(input.opponent.maxHealthPoints * 0.5) ? 280 : 0;
    const antiSetBonus = hasSetTargets(input.target) ? 120 : 0;
    const slotBonus = hasTrapAlreadySet(input.opponent) ? 0 : 180;
    return pressure + protectionNeed + antiSetBonus + slotBonus;
  }
  if (input.card.type === "ENTITY" || input.card.type === "FUSION") {
    const bestThreat = rivalBestAttack(input.target);
    const attack = input.card.attack ?? 0;
    const defense = input.card.defense ?? 0;
    const defenseStabilize = input.mode === "DEFENSE" && defense >= bestThreat && bestThreat > attack ? 360 : 0;
    const pressureSet = input.mode === "ATTACK" && hasSetTargets(input.target) ? 220 : 0;
    return defenseStabilize + pressureSet;
  }
  return 0;
}
