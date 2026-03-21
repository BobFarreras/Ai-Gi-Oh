// src/components/hub/market/layout/MarketHeaderBar.tsx - Cabecera del mercado con saldo Nexus, búsqueda y filtros principales.
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowDownUp, Layers3, ListFilter, Search } from "lucide-react";
import { GameSelect } from "@/components/ui/GameSelect";
import { BackButton } from "@/components/ui/BackButton";
import { useHubModuleSfx } from "@/components/hub/internal/use-hub-module-sfx";
import { MARKET_ORDER_OPTIONS, MARKET_TYPE_OPTIONS } from "@/components/hub/market/layout/market-filter-options";
import { IMarketTutorialActions } from "@/components/hub/market/internal/market-tutorial-contract";
import {
  MarketOrderDirection,
  MarketOrderField,
  MarketTypeFilter,
} from "@/components/hub/market/market-filters";

interface MarketHeaderBarProps {
  walletBalance: number;
  nameQuery: string;
  typeFilter: MarketTypeFilter;
  orderField: MarketOrderField;
  orderDirection: MarketOrderDirection;
  onNameQueryChange: (value: string) => void;
  onTypeFilterChange: (value: MarketTypeFilter) => void;
  onOrderFieldChange: (value: MarketOrderField) => void;
  onOrderDirectionToggle: () => void;
  tutorialActions?: IMarketTutorialActions;
  tutorialForceMobileFiltersOpen?: boolean;
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
        </div>
        <div className="hidden flex-wrap items-center justify-start gap-x-2 gap-y-3 min-w-0 overflow-visible min-[900px]:flex min-[900px]:justify-end">
          <div data-tutorial-id="market-type-filter" className="w-[110px] sm:w-[120px] shrink-0 relative z-50">
            <GameSelect
              label="TIPO"
              value={props.typeFilter}
              onChange={(value) => {
                props.onTypeFilterChange(value as MarketTypeFilter);
                props.tutorialActions?.onTypeFilterChange?.();
              }}
              onOpen={() => play("FILTER_OPEN")}
              onClose={() => play("FILTER_CLOSE")}
              ariaLabel="Filtro de tipo"
              Icon={ListFilter}
              options={MARKET_TYPE_OPTIONS}
            />
          </div>
          <div data-tutorial-id="market-order-filter" className="w-[110px] sm:w-[120px] shrink-0 relative z-40">
            <GameSelect
              label="ORDEN"
              value={props.orderField}
              onChange={(value) => {
                props.onOrderFieldChange(value as MarketOrderField);
                props.tutorialActions?.onOrderFieldChange?.();
              }}
              onOpen={() => play("FILTER_OPEN")}
              onClose={() => play("FILTER_CLOSE")}
              ariaLabel="Campo de orden"
              Icon={Layers3}
              options={MARKET_ORDER_OPTIONS}
            />
          </div>
          <motion.button
            type="button"
            data-tutorial-id="market-order-direction"
            aria-label="Dirección de orden"
            onClick={() => {
              props.onOrderDirectionToggle();
              props.tutorialActions?.onOrderDirectionToggle?.();
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex h-[38px] mt-[16px] items-center justify-center gap-1 rounded-lg border border-cyan-500/40 bg-[linear-gradient(180deg,rgba(4,34,56,0.8),rgba(3,22,38,0.9))] px-3 shadow-[inset_0_0_10px_rgba(34,211,238,0.1)] hover:border-cyan-300/80 shrink-0 relative z-30"
          >
            <motion.div animate={{ rotate: props.orderDirection === "ASC" ? 0 : 180 }}>
              <ArrowDownUp size={14} className="text-cyan-400" />
            </motion.div>
          </motion.button>
        </div>
      </div>
      {isMobileFiltersOpenEffective ? (
        <div className="relative mt-3 grid grid-cols-[1fr_1fr_auto] gap-2 min-[900px]:hidden">
          <div data-tutorial-id="market-type-filter">
            <GameSelect
              label="TIPO"
              value={props.typeFilter}
              onChange={(value) => {
                props.onTypeFilterChange(value as MarketTypeFilter);
                props.tutorialActions?.onTypeFilterChange?.();
              }}
              onOpen={() => play("FILTER_OPEN")}
              onClose={() => play("FILTER_CLOSE")}
              ariaLabel="Filtro de tipo"
              Icon={ListFilter}
              options={MARKET_TYPE_OPTIONS}
            />
          </div>
          <div data-tutorial-id="market-order-filter">
            <GameSelect
              label="ORDEN"
              value={props.orderField}
              onChange={(value) => {
                props.onOrderFieldChange(value as MarketOrderField);
                props.tutorialActions?.onOrderFieldChange?.();
              }}
              onOpen={() => play("FILTER_OPEN")}
              onClose={() => play("FILTER_CLOSE")}
              ariaLabel="Campo de orden"
              Icon={Layers3}
              options={MARKET_ORDER_OPTIONS}
            />
          </div>
          <motion.button
            type="button"
            data-tutorial-id="market-order-direction"
            aria-label="Dirección de orden"
            onClick={() => {
              props.onOrderDirectionToggle();
              props.tutorialActions?.onOrderDirectionToggle?.();
            }}
            whileTap={{ scale: 0.95 }}
            className="mt-[16px] flex h-[38px] items-center justify-center gap-1 rounded-lg border border-cyan-500/40 bg-[linear-gradient(180deg,rgba(4,34,56,0.8),rgba(3,22,38,0.9))] px-3"
          >
            <motion.div animate={{ rotate: props.orderDirection === "ASC" ? 0 : 180 }}>
              <ArrowDownUp size={14} className="text-cyan-300" />
            </motion.div>
          </motion.button>
        </div>
      ) : null}
    </header>
  );
}
