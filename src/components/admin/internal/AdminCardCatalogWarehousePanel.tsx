// src/components/admin/internal/AdminCardCatalogWarehousePanel.tsx - Panel de almacén para buscar y seleccionar cartas del catálogo administrativo.
"use client";

import { useMemo, useState } from "react";
import { IAdminCardCatalogEntry } from "@/core/entities/admin/IAdminCatalogSnapshot";
import { CardType, ICard } from "@/core/entities/ICard";
import { HomeMiniCard } from "@/components/hub/home/HomeMiniCard";

interface IAdminCardCatalogWarehousePanelProps {
  cards: IAdminCardCatalogEntry[];
  selectedCardId: string | null;
  cardById: Map<string, ICard>;
  onSelectCard: (cardId: string) => void;
}

export function AdminCardCatalogWarehousePanel({ cards, selectedCardId, cardById, onSelectCard }: IAdminCardCatalogWarehousePanelProps) {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<CardType | "ALL">("ALL");

  const filteredCards = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return cards.filter((card) => {
      const matchesType = typeFilter === "ALL" || card.type === typeFilter;
      const matchesText = normalized.length === 0 || card.id.toLowerCase().includes(normalized) || card.name.toLowerCase().includes(normalized);
      return matchesType && matchesText;
    });
  }, [cards, query, typeFilter]);

  return (
    <section className="flex h-full min-h-0 flex-col rounded-2xl border border-cyan-800/35 bg-[#031020]/50 p-3">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-black uppercase tracking-[0.2em] text-cyan-200">Almacén</h2>
        <span className="text-xs text-cyan-100/70">{filteredCards.length} cartas</span>
      </div>
      <div className="mb-3 grid grid-cols-2 gap-2">
        <input type="search" aria-label="Buscar carta en catálogo" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por id o nombre..." className="rounded-md border border-slate-600 bg-slate-900 p-2 text-xs text-slate-100" />
        <select aria-label="Filtrar catálogo por tipo" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as CardType | "ALL")} className="rounded-md border border-slate-600 bg-slate-900 p-2 text-xs font-semibold text-slate-100">
          <option value="ALL">Todos</option>
          <option value="ENTITY">Entity</option>
          <option value="EXECUTION">Execution</option>
          <option value="TRAP">Trap</option>
          <option value="FUSION">Fusion</option>
          <option value="ENVIRONMENT">Environment</option>
        </select>
      </div>
      <div className="home-modern-scroll min-h-0 flex-1 overflow-y-auto overflow-x-hidden pr-2">
        <div className="grid grid-cols-[repeat(auto-fill,minmax(84px,1fr))] gap-3 justify-items-center pb-4">
          {filteredCards.map((entry) => {
            const card = cardById.get(entry.id);
            if (!card) return null;
            return (
              <button key={entry.id} type="button" aria-label={`Seleccionar ${entry.name}`} onClick={() => onSelectCard(entry.id)} className="relative flex w-[84px] flex-col items-center">
                <HomeMiniCard card={card} label={`Carta ${entry.name}`} isSelected={selectedCardId === entry.id} showSlotContainer={false} />
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
