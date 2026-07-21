// src/components/game/card/internal/spell-trap-image-utils.ts - Utilidades compartidas para adaptación de imagen de magias/trampas.
import { ICard } from "@/core/entities/ICard";

/** Verifica si la carta es de tipo magia (EXECUTION) o trampa (TRAP). */
export function isSpellOrTrap(card: ICard): boolean {
  return card.type === "EXECUTION" || card.type === "TRAP";
}

/**
 * Devuelve las clases CSS para el render de imagen según el tipo de carta.
 * - Magias/trampas: object-cover centrado con un ligero zoom, IGUAL en todas las secciones (detalle, deck,
 *   arsenal, market), para que TODAS llenen su caja del mismo modo (marco uniforme) y con sensación de carta
 *   viva; el viñeteado (CardArtVignette) oscurece los bordes para que la ilustración "salga de la oscuridad".
 *   En el combat-log (coverRender) se ancla arriba y sin zoom: la miniatura es diminuta.
 * - Entidades: object-contain con padding para que el render no se recorte.
 */
export function getCardImageClassName(
  card: ICard,
  options: { coverRender?: boolean; includePadding?: boolean; includeDropShadow?: boolean } = {},
): string {
  const { coverRender = false, includePadding = true, includeDropShadow = true } = options;

  if (isSpellOrTrap(card) && !coverRender) {
    return "z-10 object-cover object-center scale-[1.15]";
  }

  if (coverRender) {
    return "z-10 object-cover object-top";
  }

  const padding = includePadding ? "p-1" : "";
  const dropShadow = includeDropShadow ? "drop-shadow-[0_4px_6px_rgba(0,0,0,0.65)]" : "";
  return `z-10 object-contain ${padding} ${dropShadow}`.trim();
}

/**
 * ¿Debe pintarse el viñeteado de bordes oscuros sobre el arte de una magia/trampa?
 * Solo para magias/trampas con render y fuera del coverRender del combat-log (miniatura diminuta donde
 * el sombreado no aporta). No se excluye el modo rendimiento: es un overlay de gradiente estático de coste
 * nulo (no lleva blur), así que puede pintarse también en combate (mano, detalle) sin penalización.
 */
export function shouldRenderSpellTrapVignette(card: ICard, options: { coverRender?: boolean } = {}): boolean {
  const { coverRender = false } = options;
  return isSpellOrTrap(card) && !coverRender && Boolean(card.renderUrl);
}

/**
 * Determina si se debe renderizar el fondo (bgUrl) de la carta.
 * Magias/trampas nunca muestran fondo: su arte es la ilustración a sangre completa.
 */
export function shouldRenderCardBackground(card: ICard): boolean {
  return !isSpellOrTrap(card) && Boolean(card.bgUrl);
}
