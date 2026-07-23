// src/components/admin/internal/arena/admin-arena-deck-entry-state.ts - Edición de escalado/atributos de una carta
// del mazo de arena, aplicada a TODAS sus copias.
//
// Los atributos son de la CARTA, no del hueco que ocupa: igual que un objeto de mejora del jugador afecta a
// todas sus copias, aquí tocar una Hostinger deja a todas las Hostinger de esa variante con el mismo valor. Antes
// se editaba solo la copia seleccionada y el mismo rival acababa con una carta a +300 y otra a 0, según cuál
// hubieras tocado. Se propaga también entre zonas (mazo y fusión): la carta es la misma esté donde esté.
import { IAdminArenaCardEntry } from "@/core/entities/training/IAdminArena";

export type ArenaDeckZone = "DECK" | "FUSION";

export interface IArenaDeckEntries {
  deck: IAdminArenaCardEntry[];
  fusion: IAdminArenaCardEntry[];
}

export type ArenaScaleField = "versionTier" | "level" | "xp";
export type ArenaBonusStat = "ATTACK" | "DEFENSE";

function resolveEditedEntry(entries: IArenaDeckEntries, zone: ArenaDeckZone, index: number): IAdminArenaCardEntry | null {
  return (zone === "DECK" ? entries.deck : entries.fusion)[index] ?? null;
}

/** Aplica `assign` a todas las entradas (mazo + fusión) que sean la misma carta que la editada. */
function mapSameCard(
  entries: IArenaDeckEntries,
  cardId: string,
  assign: (entry: IAdminArenaCardEntry) => IAdminArenaCardEntry,
): IArenaDeckEntries {
  const applyToZone = (zone: IAdminArenaCardEntry[]): IAdminArenaCardEntry[] =>
    zone.map((entry) => (entry.cardId === cardId ? assign(entry) : entry));
  return { deck: applyToZone(entries.deck), fusion: applyToZone(entries.fusion) };
}

/** Fija versión/nivel/XP de la carta editada en todas sus copias. */
export function applyArenaScaleToSameCards(
  entries: IArenaDeckEntries,
  zone: ArenaDeckZone,
  index: number,
  field: ArenaScaleField,
  value: number | null,
): IArenaDeckEntries {
  const edited = resolveEditedEntry(entries, zone, index);
  if (!edited) return entries;
  return mapSameCard(entries, edited.cardId, (entry) => ({ ...entry, [field]: value }));
}

/**
 * Suma `delta` al bonus de la carta EDITADA y deja ese resultado en todas sus copias (no suma el delta a cada
 * una por separado: así las copias que estuvieran descuadradas convergen al mismo valor). Nunca baja de 0.
 */
export function applyArenaBonusToSameCards(
  entries: IArenaDeckEntries,
  zone: ArenaDeckZone,
  index: number,
  stat: ArenaBonusStat,
  delta: number,
): IArenaDeckEntries {
  const edited = resolveEditedEntry(entries, zone, index);
  if (!edited) return entries;
  const key = stat === "ATTACK" ? "attackBonus" : "defenseBonus";
  const nextValue = Math.max(0, (edited[key] ?? 0) + delta);
  return mapSameCard(entries, edited.cardId, (entry) => ({ ...entry, [key]: nextValue }));
}
