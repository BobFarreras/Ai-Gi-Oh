// src/components/hub/market/layout/MarketHeaderBar.tsx - Cabecera del mercado con saldo Nexus, búsqueda y filtros principales.
"use client";

import { useState } from "react";
import { Layers, Package, Search } from "lucide-react";
import { BackButton } from "@/components/ui/BackButton";
import { useHubModuleSfx } from "@/components/hub/internal/use-hub-module-sfx";
import { IMarketTutorialActions } from "@/components/hub/market/internal/market-tutorial-contract";
import { MarketHeaderFilters } from "@/components/hub/market/layout/internal/MarketHeaderFilters";
import {
  MarketOrderDirection,
  MarketOrderField,
  MarketSection,
  MarketTypeFilter,
} from "@/components/hub/market/market-filters";

interface MarketHeaderBarProps {
  walletBalance: number;
  nameQuery: string;
  typeFilter: MarketTypeFilter;
  section: MarketSection;
  orderField: MarketOrderField;
  orderDirection: MarketOrderDirection;
  onNameQueryChange: (value: string) => void;
  onTypeFilterChange: (value: MarketTypeFilter) => void;
  onSectionChange: (value: MarketSection) => void;
  onOrderFieldChange: (value: MarketOrderField) => void;
  onOrderDirectionToggle: () => void;
  tutorialActions?: IMarketTutorialActions;
  tutorialForceMobileFiltersOpen?: boolean;
}

/** Conmutador Cartas / Objetos: dos secciones distintas del mercado, no un filtro. */
function MarketSectionSwitch({ section, onSectionChange }: { section: MarketSection; onSectionChange: (value: MarketSection) => void }) {
  const tabs: Array<{ value: MarketSection; label: string; icon: typeof Layers }> = [
    { value: "CARDS", label: "Cartas", icon: Layers },
    { value: "ITEMS", label: "Objetos", icon: Package },
  ];
  return (
    <div className="flex shrink-0 items-center gap-1 rounded-lg border border-cyan-800/60 bg-[#020a14]/80 p-0.5">
      {tabs.map((tab) => {
        const isActive = section === tab.value;
        const Icon = tab.icon;
        return (
          <button
            key={tab.value}
            type="button"
            onClick={() => onSectionChange(tab.value)}
            aria-pressed={isActive}
            aria-label={`Sección ${tab.label}`}
            className={`flex h-[34px] items-center gap-1.5 rounded-md px-2.5 text-[10px] font-black uppercase tracking-[0.12em] transition ${
              isActive ? "bg-cyan-500/20 text-cyan-100 shadow-[0_0_12px_rgba(34,211,238,0.25)]" : "text-cyan-400/70 hover:text-cyan-200"
            }`}
          >
            <Icon className="h-4 w-4" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function MarketHeaderBar(props: MarketHeaderBarProps) {
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const isMobileFiltersOpenEffective = isMobileFiltersOpen || Boolean(props.tutorialForceMobileFiltersOpen);
  const { play } = useHubModuleSfx();

  return (
    <header className="relative w-full bg-[#041120]/90 border border-cyan-800/50 p-2 sm:px-4 sm:py-2.5 rounded-xl shadow-[0_0_20px_rgba(8,145,178,0.15),inset_0_0_20px_rgba(0,0,0,0.6)] backdrop-blur-xl z-[100] overflow-visible">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgba(34,211,238,0.05),transparent_45%,rgba(59,130,246,0.05))] rounded-xl" />
      <div className="relative grid gap-4 min-[900px]:grid-cols-[1fr_1.8fr_1.2fr] items-center overflow-visible">
        <div className="flex items-center gap-3 min-[900px]:border-r border-cyan-900/60 min-[900px]:pr-4 min-w-0">
          <BackButton href="/hub" label="" className="flex shrink-0 px-2 py-1.5" />
          <h1 className="text-lg font-black uppercase tracking-widest text-cyan-100 drop-shadow-[0_0_10px_rgba(34,211,238,0.6)] truncate hidden sm:block">
            Mercado
          </h1>
          <div className="ml-auto flex min-w-[104px] items-center justify-center px-3 py-1 bg-[#020a14]/90 border border-emerald-500/40 rounded-lg shadow-[inset_0_0_15px_rgba(0,0,0,0.8)] shrink-0">
            <span className="text-sm font-black text-emerald-400 font-mono tabular-nums tracking-widest">
              {props.walletBalance} <span className="text-emerald-600 text-[10px] ml-0.5">NX</span>
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 min-w-0">
          <MarketSectionSwitch section={props.section} onSectionChange={props.onSectionChange} />
          {/* La búsqueda y el botón de filtros solo tienen sentido en la sección de cartas. */}
          {props.section === "CARDS" ? (
            <>
              <label className="flex w-full items-center gap-2 rounded-lg border border-cyan-500/30 bg-[#020a14]/80 px-3 py-1.5 shadow-[inset_0_0_15px_rgba(0,0,0,0.6)] focus-within:border-cyan-400 focus-within:shadow-[0_0_15px_rgba(34,211,238,0.2)] transition-all h-[38px]">
                <Search size={14} className="text-cyan-400 shrink-0" />
                <input
                  aria-label="Buscar carta por nombre"
                  value={props.nameQuery}
                  onChange={(event) => props.onNameQueryChange(event.target.value)}
                  className="w-full bg-transparent text-xs font-medium outline-none placeholder:text-cyan-100/40 text-cyan-50 tracking-wider truncate"
                  placeholder="BUSCAR DATOS..."
                />
              </label>
              <button
                type="button"
                data-tutorial-id="market-mobile-open-filters"
                aria-label="Mostrar filtros del mercado"
                onClick={() => {
                  setIsMobileFiltersOpen((previous) => !previous);
                  props.tutorialActions?.onOpenMobileFilters?.();
                }}
                className="flex h-[38px] items-center justify-center rounded-lg border border-cyan-500/40 bg-[#021426]/85 px-3 text-[10px] font-black uppercase tracking-[0.16em] text-cyan-200 min-[900px]:hidden"
              >
                Filtros
              </button>
            </>
          ) : null}
        </div>
        <div className="hidden flex-wrap items-center justify-start gap-x-2 gap-y-3 min-w-0 overflow-visible min-[900px]:flex min-[900px]:justify-end">
          {props.section === "CARDS" ? (
            <MarketHeaderFilters
              isMobile={false}
              typeFilter={props.typeFilter}
              orderField={props.orderField}
              orderDirection={props.orderDirection}
              onTypeFilterChange={props.onTypeFilterChange}
              onOrderFieldChange={props.onOrderFieldChange}
              onOrderDirectionToggle={props.onOrderDirectionToggle}
              tutorialActions={props.tutorialActions}
              playSfx={play}
            />
          ) : null}
        </div>
      </div>
      {isMobileFiltersOpenEffective && props.section === "CARDS" ? (
        <div className="relative mt-3 grid grid-cols-[1fr_1fr_auto] gap-2 min-[900px]:hidden">
          <MarketHeaderFilters
            isMobile={true}
            typeFilter={props.typeFilter}
            orderField={props.orderField}
            orderDirection={props.orderDirection}
            onTypeFilterChange={props.onTypeFilterChange}
            onOrderFieldChange={props.onOrderFieldChange}
            onOrderDirectionToggle={props.onOrderDirectionToggle}
            tutorialActions={props.tutorialActions}
            playSfx={play}
          />
        </div>
      ) : null}
    </header>
  );
}
