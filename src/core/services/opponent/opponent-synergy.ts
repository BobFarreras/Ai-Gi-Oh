// src/core/services/opponent/opponent-synergy.ts - Ficha 5 fase 5: sinergias de combo por-efecto. Ajusta el
// score de una carta según si sus PIEZAS compañeras están (o pueden estar) en juego, en vez de if's por
// carta id. Evita que la IA juegue piezas de combo en el vacío (p.ej. setear el Escudo TypeScript sin tener
// TypeScript, o la magia de atacar-en-defensa sin entities en defensa) y prioriza montarlas cuando toca.
import { ICard } from "@/core/entities/ICard";
import { IPlayer } from "@/core/entities/IPlayer";

/** ¿Dónde está una carta compañera? (para decidir cuánta sinergia potencial hay). */
function locateCard(opponent: IPlayer, cardId: string): "BOARD" | "HAND" | "DECK" | "NONE" {
  if (opponent.activeEntities.some((entity) => entity.card.id === cardId)) return "BOARD";
  if (opponent.hand.some((card) => card.id === cardId)) return "HAND";
  if (opponent.deck.some((card) => card.id === cardId)) return "DECK";
  return "NONE";
}

/** Entities propias que se beneficiarían de "atacar en defensa" (en DEFENSA/SET con DEF útil). */
function defenseAttackBeneficiaries(opponent: IPlayer): number {
  return opponent.activeEntities.filter(
    (entity) => (entity.mode === "DEFENSE" || entity.mode === "SET") && (entity.card.defense ?? 0) >= 1200,
  ).length;
}

/**
 * Ajuste de score por sinergia de combo. Positivo si las piezas compañeras están listas; negativo si la
 * carta se jugaría en el vacío (para que la heurística prefiera otra jugada y no queme la pieza).
 */
export function resolveSynergyBonus(card: ICard, opponent: IPlayer): number {
  const effect = card.effect;
  if (!effect) return 0;

  // Escudo ligado (Escudo TypeScript): solo sirve si tienes la entity ligada. Sin ella, trampa muerta.
  if (effect.action === "REINFORCE_LINKED_ENTITY_ON_ATTACK") {
    const where = locateCard(opponent, effect.linkedCardId);
    if (where === "BOARD") return 900; // combo vivo: protege tu entity ligada → alta prioridad
    if (where === "HAND") return 250; // la entity vendrá pronto: setear con antelación es razonable
    if (where === "DECK") return -200; // podría llegar, pero hoy es humo: no prioritaria
    return -900; // no la tienes en ningún sitio: NO setear una trampa muerta
  }

  // Atacar en defensa (Escudo Firewall Ofensivo): útil solo si tienes muros en defensa que puedan pegar.
  if (effect.action === "ALLOW_DEFENSE_MODE_ATTACK") {
    const beneficiaries = defenseAttackBeneficiaries(opponent);
    if (beneficiaries === 0) return -700; // sin muros en defensa no hace nada: no jugarla ahora
    return 500 + beneficiaries * 250; // cuantos más muros, mejor el combo
  }

  return 0;
}
