// src/components/admin/internal/pve/use-olympus-legend-draft.ts - Draft editable de una leyenda: identidad, recompensas y deck en un solo guardado.
"use client";

import { useMemo, useState } from "react";
import { ICard } from "@/core/entities/ICard";
import { IAdminOlympusLegend, IUpsertOlympusLegendCommand } from "@/core/entities/admin/IAdminPveModes";
import { IAdminArenaCardEntry } from "@/core/entities/training/IAdminArena";
import { getMaxCardLevel, getTotalXpRequiredToReachLevel } from "@/core/services/progression/card-level-rules";
import { MAX_CARD_VERSION_TIER } from "@/core/services/progression/card-version-rules";
import {
  ArenaDeckZone,
  applyArenaBonusToSameCards,
  applyArenaScaleToSameCards,
} from "@/components/admin/internal/arena/admin-arena-deck-entry-state";

export function createEmptyLegend(sortOrder: number): IUpsertOlympusLegendCommand {
  const id = `legend-${Math.random().toString(36).slice(2, 7)}`;
  return {
    id, code: id.toUpperCase().replace(/-/g, "_"), displayName: "Nueva leyenda",
    deckTemplateId: "", aiProfile: "MYTHIC", startingLp: 12000, energyBonus: 0,
    rewardDefinitionId: `olympus-${id}`, avatarPath: null, introPath: null, victoryPath: null, defeatPath: null,
    lore: null, specialRules: [], baseFragmentReward: 120, firstVictoryFragmentBonus: 300,
    defeatFragmentReward: 15, nexusReward: 200,
    // Sin carta y limitada a la primera victoria: repartir botín es una decisión explícita.
    cardRewardId: null, cardRewardFirstVictoryOnly: true,
    availableFromIso: null, availableUntilIso: null,
    // Nace inactiva: una leyenda sin deck ni arte no debe aparecerle al jugador por accidente.
    isActive: false, sortOrder, deckCards: [], fusionCards: [],
  };
}

/** La versión la sube el servidor al guardar; el draft no la transporta para no reenviarla desde el cliente. */
function toCommand(legend: IAdminOlympusLegend): IUpsertOlympusLegendCommand {
  const command: Record<string, unknown> = { ...legend };
  delete command.version;
  return {
    ...(command as IUpsertOlympusLegendCommand),
    deckCards: [...legend.deckCards],
    fusionCards: [...legend.fusionCards],
  };
}

/** Una leyenda promete "deck a versión máxima": las cartas nuevas nacen al tope vigente del juego. */
const NEW_ENTRY = (cardId: string): IAdminArenaCardEntry => ({
  cardId,
  versionTier: MAX_CARD_VERSION_TIER,
  level: getMaxCardLevel(),
  xp: getTotalXpRequiredToReachLevel(getMaxCardLevel()),
  attackBonus: 0,
  defenseBonus: 0,
});

export type OlympusLegendDraft = ReturnType<typeof useOlympusLegendDraft>;

export function useOlympusLegendDraft(legend: IAdminOlympusLegend | IUpsertOlympusLegendCommand | null, validCards: ICard[]) {
  const [draft, setDraft] = useState<IUpsertOlympusLegendCommand | null>(null);
  const [selectedDeckRef, setSelectedDeckRef] = useState<{ zone: ArenaDeckZone; index: number } | null>(null);
  const [selectedCollectionCardId, setSelectedCollectionCardId] = useState<string | null>(null);

  const base = legend ? ("version" in legend ? toCommand(legend) : legend) : null;
  const current = draft && base && draft.id === base.id ? draft : base;
  const cardById = useMemo(() => new Map(validCards.map((card) => [card.id, card] as const)), [validCards]);

  const edit = (patch: Partial<IUpsertOlympusLegendCommand>) => {
    if (!current) return;
    setDraft({ ...current, ...patch });
  };
  const editDeck = (mutator: (entries: { deck: IAdminArenaCardEntry[]; fusion: IAdminArenaCardEntry[] }) => { deck: IAdminArenaCardEntry[]; fusion: IAdminArenaCardEntry[] }) => {
    if (!current) return;
    const next = mutator({ deck: current.deckCards, fusion: current.fusionCards });
    setDraft({ ...current, deckCards: next.deck, fusionCards: next.fusion });
  };

  const selectedEntry = current && selectedDeckRef
    ? (selectedDeckRef.zone === "DECK" ? current.deckCards : current.fusionCards)[selectedDeckRef.index] ?? null
    : null;
  const selectedCard = selectedEntry
    ? cardById.get(selectedEntry.cardId) ?? null
    : selectedCollectionCardId ? cardById.get(selectedCollectionCardId) ?? null : null;

  return {
    current,
    cardById,
    hasChanges: draft !== null && base !== null && draft.id === base.id,
    selectedDeckRef,
    selectedCollectionCardId,
    selectedEntry,
    selectedCard,
    edit,
    discard: () => { setDraft(null); setSelectedDeckRef(null); setSelectedCollectionCardId(null); },
    selectCollectionCard(cardId: string) { setSelectedCollectionCardId(cardId); setSelectedDeckRef(null); },
    selectDeckCard(zone: ArenaDeckZone, index: number) { setSelectedDeckRef({ zone, index }); setSelectedCollectionCardId(null); },
    addCard(zone: ArenaDeckZone, cardId: string) {
      editDeck((entries) => zone === "DECK"
        ? { ...entries, deck: [...entries.deck, NEW_ENTRY(cardId)] }
        : { ...entries, fusion: [...entries.fusion, NEW_ENTRY(cardId)] });
    },
    removeCard(zone: ArenaDeckZone, index: number) {
      editDeck((entries) => zone === "DECK"
        ? { ...entries, deck: entries.deck.filter((_, position) => position !== index) }
        : { ...entries, fusion: entries.fusion.filter((_, position) => position !== index) });
      setSelectedDeckRef(null);
    },
    /** Escalado y objetos se aplican a todas las copias de la carta, igual que en Arena y Story. */
    setScale(zone: ArenaDeckZone, index: number, field: "versionTier" | "level" | "xp", value: number | null) {
      editDeck((entries) => applyArenaScaleToSameCards(entries, zone, index, field, value));
    },
    adjustBonus(zone: ArenaDeckZone, index: number, stat: "ATTACK" | "DEFENSE", delta: number) {
      editDeck((entries) => applyArenaBonusToSameCards(entries, zone, index, stat, delta));
    },
  };
}
