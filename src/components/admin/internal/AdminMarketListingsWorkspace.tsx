// src/components/admin/internal/AdminMarketListingsWorkspace.tsx - Workspace visual para gestionar listados de cartas y precios en mercado admin.
"use client";

import { useMemo, useState } from "react";
import { HomeCardInspector } from "@/components/hub/home/HomeCardInspector";
import { HomeMiniCard } from "@/components/hub/home/HomeMiniCard";
import { IAdminCardCatalogEntry, IAdminMarketCardListingEntry } from "@/core/entities/admin/IAdminCatalogSnapshot";
import { CardType, ICard } from "@/core/entities/ICard";

interface IAdminMarketListingsWorkspaceProps {
  cards: IAdminCardCatalogEntry[];
  cardById: Map<string, ICard>;
  listingByCardId: Map<string, IAdminMarketCardListingEntry>;
  selectedCardId: string;
  draft: { id: string; rarity: string; priceNexusText: string; stockText: string; isAvailable: boolean };
  isBusy: boolean;
  onSelectCard: (cardId: string) => void;
  onUpdateDraft: (key: "id" | "rarity" | "priceNexusText" | "stockText" | "isAvailable", value: string | boolean) => void;
  onSave: () => Promise<void>;
}

export function AdminMarketListingsWorkspace({ cards, cardById, listingByCardId, selectedCardId, draft, isBusy, onSelectCard, onUpdateDraft, onSave }: IAdminMarketListingsWorkspaceProps) {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<CardType | "ALL">("ALL");
  const [availabilityFilter, setAvailabilityFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const selectedCard = cardById.get(selectedCardId) ?? null;
  const filteredCards = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return cards.filter((card) => {
      const matchesType = typeFilter === "ALL" || card.type === typeFilter;
      const matchesText = normalized.length === 0 || card.name.toLowerCase().includes(normalized) || card.id.toLowerCase().includes(normalized);
      const listing = listingByCardId.get(card.id);
      const isActive = listing?.isAvailable ?? false;
      const matchesAvailability = availabilityFilter === "ALL" || (availabilityFilter === "ACTIVE" ? isActive : !isActive);
      return matchesType && matchesText && matchesAvailability;
    });
  }, [availabilityFilter, cards, listingByCardId, query, typeFilter]);

  return (
    <div className="grid min-h-0 flex-1 gap-3 xl:grid-cols-[minmax(0,1fr)_360px]">
      <section className="flex min-h-0 flex-col rounded-2xl border border-cyan-800/35 bg-[#031020]/50 p-3">
        <div className="mb-3 grid grid-cols-3 gap-2">
          <input type="search" aria-label="Buscar carta en market" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por id o nombre..." className="rounded-md border border-slate-600 bg-slate-900 p-2 text-xs text-slate-100" />
          <select aria-label="Filtrar cartas market por tipo" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as CardType | "ALL")} className="rounded-md border border-slate-600 bg-slate-900 p-2 text-xs text-slate-100"><option value="ALL">Todos</option><option value="ENTITY">Entity</option><option value="EXECUTION">Execution</option><option value="TRAP">Trap</option><option value="FUSION">Fusion</option><option value="ENVIRONMENT">Environment</option></select>
          <select aria-label="Filtrar cartas market por disponibilidad" value={availabilityFilter} onChange={(event) => setAvailabilityFilter(event.target.value as "ALL" | "ACTIVE" | "INACTIVE")} className="rounded-md border border-slate-600 bg-slate-900 p-2 text-xs text-slate-100"><option value="ALL">Todas</option><option value="ACTIVE">Con listing activo</option><option value="INACTIVE">Sin listing/inactivas</option></select>
        </div>
        <div className="home-modern-scroll min-h-0 flex-1 overflow-y-auto overflow-x-hidden pr-2">
          <div className="grid grid-cols-[repeat(auto-fill,minmax(88px,1fr))] gap-3 justify-items-center pb-4">
            {filteredCards.map((entry) => {
              const card = cardById.get(entry.id);
              if (!card) return null;
              const listing = listingByCardId.get(entry.id);
              return (
                <button key={entry.id} type="button" aria-label={`Seleccionar ${entry.name} en market`} className="relative w-[88px]" onClick={() => onSelectCard(entry.id)}>
                  <HomeMiniCard card={card} label={`Carta ${entry.name}`} isSelected={selectedCardId === entry.id} showSlotContainer={false} />
                  <span className={`absolute -bottom-2 left-1/2 -translate-x-1/2 rounded border px-1 py-0.5 text-[10px] font-bold ${listing ? "border-emerald-500 bg-emerald-950/70 text-emerald-200" : "border-slate-600 bg-slate-900 text-slate-300"}`}>
                    {listing ? `${listing.priceNexus} NX` : "Sin listing"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <div className="grid min-h-0 gap-3 grid-rows-[minmax(0,1fr)_auto]">
        <HomeCardInspector selectedCard={selectedCard} selectedCardVersionTier={0} selectedCardLevel={0} selectedCardXp={0} selectedCardMasteryPassiveSkillId={null} minCardScale={0.62} maxCardScale={0.98} />
        <section className="rounded-2xl border border-slate-700 bg-slate-900/70 p-3 text-xs text-slate-200">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-cyan-200">Listing</p>
          <div className="grid gap-2">
            <input aria-label="ID listing" placeholder="listing-entity-vscode" className="rounded-md border border-slate-600 bg-slate-900 p-2 text-xs text-slate-100" value={draft.id} onChange={(event) => onUpdateDraft("id", event.target.value)} disabled={isBusy} />
            <select aria-label="Rarity listing" className="rounded-md border border-slate-600 bg-slate-900 p-2 text-xs text-slate-100" value={draft.rarity} onChange={(event) => onUpdateDraft("rarity", event.target.value)} disabled={isBusy}><option>COMMON</option><option>RARE</option><option>EPIC</option><option>LEGENDARY</option></select>
            <input aria-label="Precio Nexus listing" className="rounded-md border border-slate-600 bg-slate-900 p-2 text-xs text-slate-100" value={draft.priceNexusText} onChange={(event) => onUpdateDraft("priceNexusText", event.target.value)} disabled={isBusy} placeholder="Ej: 220" />
            <input aria-label="Stock listing" className="rounded-md border border-slate-600 bg-slate-900 p-2 text-xs text-slate-100" value={draft.stockText} onChange={(event) => onUpdateDraft("stockText", event.target.value)} disabled={isBusy} placeholder="Vacío = ilimitado" />
            <label className="inline-flex items-center gap-2 rounded-md border border-slate-600 bg-slate-900 p-2"><input type="checkbox" checked={draft.isAvailable} onChange={(event) => onUpdateDraft("isAvailable", event.target.checked)} disabled={isBusy} />Disponible</label>
            <button type="button" aria-label="Guardar listing de carta" className="h-9 rounded-md border border-emerald-500 px-3 text-xs font-bold uppercase text-emerald-200" onClick={() => void onSave()} disabled={isBusy}>Guardar listing</button>
          </div>
        </section>
      </div>
    </div>
  );
}
