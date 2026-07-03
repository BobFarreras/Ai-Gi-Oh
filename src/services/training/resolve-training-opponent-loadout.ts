// src/services/training/resolve-training-opponent-loadout.ts - Resuelve perfil y mazos del oponente de arena (datos de BD o, por defecto, de los presets en código).
import { OpponentDifficulty } from "@/core/services/opponent/difficulty/types";
import { ValidationError } from "@/core/errors/ValidationError";
import { ICard } from "@/core/entities/ICard";
import { IArenaDeckVariant, IArenaOpponent } from "@/core/entities/training/IArenaOpponent";
import { CARD_BY_ID } from "@/infrastructure/repositories/internal/card-catalog";
import { applyArenaCardScaling, ITrainingCardScale, resolveDifficultyScale } from "@/services/training/internal/training-card-scaling";
import { buildArenaOpponentsFromPresets } from "@/services/training/internal/build-arena-opponents-from-presets";

/**
 * Roster FIJO del ladder de Arena: los MISMOS 6 rivales en TODOS los niveles, en este orden.
 * - Cada nivel los presenta más fuertes (la fuerza la aporta el escalado/dificultad del tier).
 * - Se enfrentan EN ORDEN por victorias del nivel: ganas al Nº k para desbloquear al Nº k+1.
 *   6 victorias completan el nivel (ver `requiredWinsInPreviousTier` del catálogo de tiers).
 * Orden (decisión de producto): GenNvim → Helena → Jaku → Mouretech → Soldado → Guill.
 * BigLog (`training-tier-4`) queda fuera del ladder; Mouretech ocupa su puesto.
 */
export const ARENA_LADDER_ROSTER: readonly string[] = [
  "training-tier-1", // GenNvim
  "training-tier-2", // Helena
  "training-tier-3", // Jaku
  "training-mouretech", // Mouretech (en el puesto de BigLog)
  "training-tier-5", // Soldado
  "training-tier-6", // Guill
];

interface IResolveTrainingOpponentLoadoutInput {
  tier: number;
  aiDifficulty: OpponentDifficulty;
  /** Victorias en el nivel actual: determina a qué rival del roster te enfrentas (en orden). */
  tierWins: number;
  /** Combates jugados en el nivel actual: rota la variante de mazo del rival. */
  tierMatches: number;
  /** Catálogo de oponentes (BD); por defecto se construye desde las constantes en código. */
  opponents?: Record<string, IArenaOpponent>;
  /** Catálogo de cartas para hidratar el mazo; por defecto el catálogo en código. */
  cardCatalog?: Map<string, ICard>;
  /** Escalado de cartas propio del tier; si se omite, se usa el escalado por dificultad. */
  defaultScaling?: ITrainingCardScale | null;
}

export interface ITrainingOpponentLoadout {
  tier: number;
  difficulty: OpponentDifficulty;
  storyOpponentId: string;
  displayName: string;
  avatarUrl: string;
  introUrl: string;
  deckVariantId: string;
  deckVariantLabel: string;
  deck: ICard[];
  fusionDeck: ICard[];
  /** Posición (0-based) del rival dentro del ladder del nivel (para "Combate X/N"). */
  ladderIndex: number;
  /** Nº de combates por nivel (tamaño del roster efectivo). */
  ladderSize: number;
}

/** Entrada del ladder para la UI (fila de "monedas" de progreso del nivel). */
export interface IArenaLadderEntry {
  templateId: string;
  storyOpponentId: string;
  displayName: string;
  avatarUrl: string;
}

/**
 * Devuelve los 6 rivales del ladder EN ORDEN con su identidad visual, para pintar el progreso del
 * nivel en el lobby (ganados / siguiente / pendientes). Usa el catálogo de BD si se provee.
 */
export function resolveArenaLadderRoster(opponents?: Record<string, IArenaOpponent>): IArenaLadderEntry[] {
  const source = opponents ?? buildArenaOpponentsFromPresets();
  return ARENA_LADDER_ROSTER.map((templateId) => {
    const opponent = source[templateId];
    if (!opponent) return null;
    return { templateId, storyOpponentId: opponent.storyOpponentId, displayName: opponent.displayName, avatarUrl: opponent.avatarUrl };
  }).filter((entry): entry is IArenaLadderEntry => entry !== null);
}

/** Roster efectivo: los miembros del ladder presentes en el catálogo, conservando el orden. */
function resolveLadderRoster(opponents: Record<string, IArenaOpponent>): string[] {
  const roster = ARENA_LADDER_ROSTER.filter((templateId) => Boolean(opponents[templateId]));
  if (roster.length === 0) throw new ValidationError("No hay oponentes de arena disponibles para el ladder.");
  return roster;
}

function resolveDeckVariant(opponent: IArenaOpponent, rotation: number): IArenaDeckVariant {
  if (opponent.variants.length === 0) throw new ValidationError(`El oponente '${opponent.id}' no tiene variantes de mazo.`);
  return opponent.variants[rotation % opponent.variants.length];
}

function toVariantLabel(variant: IArenaDeckVariant): string {
  if (variant.label) return variant.label;
  return variant.id
    .split("-")
    .map((word) => `${word.slice(0, 1).toUpperCase()}${word.slice(1)}`)
    .join(" ");
}

/**
 * Resuelve el rival de arena del combate actual: roster FIJO de 6 (igual en todos los niveles),
 * enfrentado EN ORDEN por victorias del nivel, con la fuerza (escalado + dificultad) FIJA del tier.
 * Acepta opcionalmente el catálogo de BD; sin él usa los presets en código (mismo comportamiento).
 */
export function resolveTrainingOpponentLoadout(input: IResolveTrainingOpponentLoadoutInput): ITrainingOpponentLoadout {
  const opponents = input.opponents ?? buildArenaOpponentsFromPresets();
  const cardCatalog = input.cardCatalog ?? CARD_BY_ID;
  const roster = resolveLadderRoster(opponents);
  // Índice del rival = victorias del nivel (en orden). El módulo mantiene el índice dentro del roster
  // aunque el contador venga por encima (defensivo); dentro de un nivel va de 0 a roster.length-1.
  const ladderIndex = ((input.tierWins % roster.length) + roster.length) % roster.length;
  const selectedTemplateId = roster[ladderIndex];
  const opponent = opponents[selectedTemplateId];
  if (!opponent) throw new ValidationError(`No existe preset de oponente para '${selectedTemplateId}'.`);
  const selectedVariant = resolveDeckVariant(opponent, input.tierMatches);
  // El escalado propio del tier (editable) manda; si no hay, se usa el de la dificultad del tier.
  const baseScale = input.defaultScaling ?? resolveDifficultyScale(input.aiDifficulty);
  return {
    tier: input.tier,
    difficulty: input.aiDifficulty,
    storyOpponentId: opponent.storyOpponentId,
    displayName: opponent.displayName,
    avatarUrl: opponent.avatarUrl,
    introUrl: opponent.introUrl,
    deckVariantId: selectedVariant.id,
    deckVariantLabel: toVariantLabel(selectedVariant),
    deck: applyArenaCardScaling(selectedVariant.deckCards, baseScale, cardCatalog),
    fusionDeck: applyArenaCardScaling(selectedVariant.fusionCards, baseScale, cardCatalog),
    ladderIndex,
    ladderSize: roster.length,
  };
}
