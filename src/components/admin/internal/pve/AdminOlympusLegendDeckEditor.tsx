// src/components/admin/internal/pve/AdminOlympusLegendDeckEditor.tsx - Editor visual del deck legendario, reutilizando el grid y el almacén de Arena.
"use client";

import { ICard } from "@/core/entities/ICard";
import { applyCardProgressionToCard } from "@/services/game/apply-card-progression-to-card";
import { AdminArenaDeckGrid } from "@/components/admin/internal/arena/AdminArenaDeckGrid";
import { AdminStarterDeckCollectionPanel } from "@/components/admin/internal/AdminStarterDeckCollectionPanel";
import { BonusStepper, CollapsibleSection } from "@/components/admin/internal/DetailBonusControls";
import { HomeCardInspector } from "@/components/hub/home/HomeCardInspector";
import { PVE_FIELD, PVE_GHOST_BUTTON } from "@/components/admin/internal/pve/admin-pve-styles";
import { OlympusLegendDraft } from "@/components/admin/internal/pve/use-olympus-legend-draft";
import { getMaxCardLevel } from "@/core/services/progression/card-level-rules";
import { MAX_CARD_VERSION_TIER } from "@/core/services/progression/card-version-rules";

const SCALE_FIELDS: { key: "versionTier" | "level"; label: string; max: number }[] = [
  { key: "versionTier", label: "Ver", max: MAX_CARD_VERSION_TIER },
  { key: "level", label: "Lvl", max: getMaxCardLevel() },
];

const BONUS_STEP = 100;

export function AdminOlympusLegendDeckEditor({ draft, validCards }: { draft: OlympusLegendDraft; validCards: ICard[] }) {
  const legend = draft.current;
  if (!legend) return null;
  const ref = draft.selectedDeckRef;
  const entry = draft.selectedEntry;
  // Preview con la carta ya resuelta (escalado + objetos), igual que verá el jugador en combate.
  const previewCard = draft.selectedCard
    ? applyCardProgressionToCard(
      draft.selectedCard,
      {
        playerId: "", cardId: draft.selectedCard.id, versionTier: entry?.versionTier ?? 0,
        level: entry?.level ?? 0, xp: entry?.xp ?? 0, masteryPassiveSkillId: null, updatedAtIso: "",
      },
      { attackBonus: entry?.attackBonus ?? 0, defenseBonus: entry?.defenseBonus ?? 0 },
    )
    : null;

  return (
    <div className="flex min-h-0 flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" aria-label="Añadir carta seleccionada al deck legendario" className={PVE_GHOST_BUTTON}
          disabled={!draft.selectedCollectionCardId}
          onClick={() => draft.selectedCollectionCardId && draft.addCard("DECK", draft.selectedCollectionCardId)}>
          ↓ Al mazo
        </button>
        <button type="button" aria-label="Añadir carta seleccionada a fusión" className={`${PVE_GHOST_BUTTON} border-violet-600/50 text-violet-200 hover:bg-violet-900/40`}
          disabled={!draft.selectedCollectionCardId}
          onClick={() => draft.selectedCollectionCardId && draft.addCard("FUSION", draft.selectedCollectionCardId)}>
          ↓ A fusión
        </button>
        <span className="text-[10px] text-slate-500">{legend.deckCards.length} cartas · {legend.fusionCards.length} de fusión</span>
      </div>

      <div className="grid min-h-0 gap-2.5 max-xl:flex max-xl:flex-col xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_320px]">
        <div className="min-h-0 max-xl:h-[42vh] max-xl:shrink-0 xl:contents">
          <AdminArenaDeckGrid
            deck={legend.deckCards}
            fusion={legend.fusionCards}
            cardById={draft.cardById}
            isEditMode
            selectedRef={ref}
            onSelect={draft.selectDeckCard}
            onRemove={draft.removeCard}
          />
        </div>
        <div className="min-h-0 max-xl:h-[52vh] max-xl:shrink-0 xl:contents">
          <AdminStarterDeckCollectionPanel
            availableCards={validCards}
            selectedCardId={draft.selectedCollectionCardId}
            isEditMode
            onSelectCard={draft.selectCollectionCard}
            onDropToCollection={(event) => event.preventDefault()}
            onStartDragCard={() => undefined}
          />
        </div>
        <div className="flex min-h-0 flex-col gap-2">
          <div className="min-h-[220px] flex-1">
            <HomeCardInspector
              selectedCard={previewCard}
              selectedCardVersionTier={entry?.versionTier ?? 0}
              selectedCardLevel={entry?.level ?? 0}
              selectedCardXp={entry?.xp ?? 0}
              selectedCardMasteryPassiveSkillId={null}
              minCardScale={0.55}
              maxCardScale={0.92}
            />
          </div>
          <CollapsibleSection title="Escalado de la carta" accent="cyan">
            <p className="text-[10px] text-slate-400">El deck legendario viaja versionado: sin override se guarda a 30/5.</p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {SCALE_FIELDS.map((field) => (
                <label key={field.key} className="text-[10px] text-slate-400">
                  {field.label}
                  <input
                    aria-label={`${field.label} de la carta legendaria`}
                    type="number" min={0} max={field.max}
                    value={entry?.[field.key] ?? 0}
                    disabled={!ref}
                    onChange={(event) => ref && draft.setScale(ref.zone, ref.index, field.key, Number(event.target.value) || null)}
                    className={`${PVE_FIELD} mt-1 h-8 w-full disabled:opacity-50`}
                  />
                </label>
              ))}
              <label className="text-[10px] text-slate-400">
                XP
                <input
                  aria-label="XP de la carta legendaria"
                  type="number" min={0}
                  value={entry?.xp ?? 0}
                  disabled={!ref}
                  onChange={(event) => ref && draft.setScale(ref.zone, ref.index, "xp", Number(event.target.value) || null)}
                  className={`${PVE_FIELD} mt-1 h-8 w-full disabled:opacity-50`}
                />
              </label>
            </div>
          </CollapsibleSection>
          <CollapsibleSection title="Objetos equipados" accent="fuchsia">
            <div className="mt-2 grid grid-cols-2 gap-2">
              <BonusStepper label="Ataque" colorClass="text-rose-300" value={entry?.attackBonus ?? 0} step={BONUS_STEP} disabled={!ref}
                onAdd={() => ref && draft.adjustBonus(ref.zone, ref.index, "ATTACK", BONUS_STEP)}
                onRemove={() => ref && draft.adjustBonus(ref.zone, ref.index, "ATTACK", -BONUS_STEP)} />
              <BonusStepper label="Defensa" colorClass="text-sky-300" value={entry?.defenseBonus ?? 0} step={BONUS_STEP} disabled={!ref}
                onAdd={() => ref && draft.adjustBonus(ref.zone, ref.index, "DEFENSE", BONUS_STEP)}
                onRemove={() => ref && draft.adjustBonus(ref.zone, ref.index, "DEFENSE", -BONUS_STEP)} />
            </div>
          </CollapsibleSection>
        </div>
      </div>
    </div>
  );
}
