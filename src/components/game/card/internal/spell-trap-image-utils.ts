// src/components/game/card/internal/spell-trap-image-utils.ts - Utilidades compartidas para adaptación de imagen de magias/trampas.
import { ICard } from "@/core/entities/ICard";

/** Verifica si la carta es de tipo magia (EXECUTION) o trampa (TRAP). */
export function isSpellOrTrap(card: ICard): boolean {
  return card.type === "EXECUTION" || card.type === "TRAP";
}

/**
 * Devuelve las clases CSS para el render de imagen según el tipo de carta.
 * - Magias/trampas: object-cover para llenar la zona (la ilustración es a sangre).
 * - Entidades: object-contain con padding para que el render no se recorte.
 */
export function getCardImageClassName(
  card: ICard,
  options: { coverRender?: boolean; includePadding?: boolean; includeDropShadow?: boolean } = {},
): string {
  const { coverRender = false, includePadding = true, includeDropShadow = true } = options;

  if (isSpellOrTrap(card) || coverRender) {
    return "z-10 object-cover object-top";
  }

  const padding = includePadding ? "p-1" : "";
  const dropShadow = includeDropShadow ? "drop-shadow-[0_4px_6px_rgba(0,0,0,0.65)]" : "";
  return `z-10 object-contain ${padding} ${dropShadow}`.trim();
}

/**
 * Determina si se debe renderizar el fondo (bgUrl) de la carta.
 * Magias/trampas nunca muestran fondo: su arte es la ilustración a sangre completa.
 */
export function shouldRenderCardBackground(card: ICard): boolean {
  return !isSpellOrTrap(card) && Boolean(card.bgUrl);
}
