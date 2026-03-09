// src/components/hub/home/layout/internal/HomeMobileDeckPanel.tsx - Renderiza panel móvil del deck principal y bloque de fusiones.
import { HomeMiniCard } from "@/components/hub/home/HomeMiniCard";
import { ICard } from "@/core/entities/ICard";
import { IHomeWorkspaceProps } from "@/components/hub/home/layout/home-workspace-types";

interface IHomeMobileDeckPanelProps {
  props: IHomeWorkspaceProps;
  cardById: Map<string, ICard>;
  deckSlotsForView: IHomeWorkspaceProps["deck"]["slots"];
  onSelectSlot: (slotIndex: number) => void;
  onSelectFusionSlot: (slotIndex: number) => void;
}

/**
 * Agrupa la sección móvil del deck para reducir complejidad del contenedor.
 */
export function HomeMobileDeckPanel({ props, cardById, deckSlotsForView, onSelectSlot, onSelectFusionSlot }: IHomeMobileDeckPanelProps) {
  return (
    <>
      <div className="grid grid-cols-4 gap-1 pb-3 pt-1">
        {deckSlotsForView.map((slot) => {
          const card = slot.cardId ? (cardById.get(slot.cardId) ?? null) : null;
          const progress = slot.cardId ? (props.cardProgressById.get(slot.cardId) ?? null) : null;
          const isSelected = props.selectedSlotIndex === slot.index || (slot.cardId !== null && slot.cardId === props.selectedCardId);
          return (
            <HomeMiniCard
              key={slot.index}
              card={card}
              isSelected={isSelected}
              label={`Slot ${slot.index + 1}`}
              onClick={() => onSelectSlot(slot.index)}
              isDraggable={card !== null}
              onDragStart={(event) => props.onStartDragDeckSlot(slot.index, event)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => props.onDropOnDeckSlot(slot.index, event)}
              showSlotContainer={card === null}
              size="mobileLarge"
              versionTier={progress?.versionTier ?? 0}
              level={progress?.level ?? 0}
              xp={progress?.xp ?? 0}
              masteryPassiveSkillId={progress?.masteryPassiveSkillId ?? null}
            />
          );
        })}
        {deckSlotsForView.length === 0 ? (
          <p className="col-span-4 rounded-lg border border-cyan-900/40 bg-black/30 p-2 text-center text-[11px] text-cyan-200/80">No hay cartas del deck que cumplan el filtro.</p>
        ) : null}
      </div>
      <div className="mt-2 rounded-lg border border-fuchsia-800/40 bg-fuchsia-950/15 p-2">
        <p className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-fuchsia-200">Bloque Fusiones</p>
        <div className="grid grid-cols-2 place-items-center gap-2">
          {props.deck.fusionSlots.map((slot) => {
            const card = slot.cardId ? (cardById.get(slot.cardId) ?? null) : null;
            const progress = slot.cardId ? (props.cardProgressById.get(slot.cardId) ?? null) : null;
            const isSelected = props.selectedFusionSlotIndex === slot.index || (slot.cardId !== null && slot.cardId === props.selectedCardId);
            return (
              <div key={`mobile-fusion-slot-${slot.index}`} className="w-[84px]">
                <HomeMiniCard
                  card={card}
                  isSelected={isSelected}
                  label={`Fusión ${slot.index + 1}`}
                  onClick={() => onSelectFusionSlot(slot.index)}
                  isDraggable={card !== null}
                  onDragStart={(event) => props.onStartDragFusionSlot(slot.index, event)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => props.onDropOnFusionSlot(slot.index, event)}
                  showSlotContainer={card === null}
                  size="mobileLarge"
                  versionTier={progress?.versionTier ?? 0}
                  level={progress?.level ?? 0}
                  xp={progress?.xp ?? 0}
                  masteryPassiveSkillId={progress?.masteryPassiveSkillId ?? null}
                />
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
