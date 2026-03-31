// src/components/hub/market/layout/internal/MarketHeaderFilters.tsx - Renderiza controles de filtros/orden del header del mercado para desktop y móvil sin duplicación.
"use client";

import { motion } from "framer-motion";
import { ArrowDownUp, Layers3, ListFilter } from "lucide-react";
import { GameSelect } from "@/components/ui/GameSelect";
import { MARKET_ORDER_OPTIONS, MARKET_TYPE_OPTIONS } from "@/components/hub/market/layout/market-filter-options";
import { IMarketTutorialActions } from "@/components/hub/market/internal/market-tutorial-contract";
import { MarketOrderDirection, MarketOrderField, MarketTypeFilter } from "@/components/hub/market/market-filters";
import { HubModuleSfxId } from "@/components/hub/internal/use-hub-module-sfx";

interface IMarketHeaderFiltersProps {
  isMobile: boolean;
  typeFilter: MarketTypeFilter;
  orderField: MarketOrderField;
  orderDirection: MarketOrderDirection;
  onTypeFilterChange: (value: MarketTypeFilter) => void;
  onOrderFieldChange: (value: MarketOrderField) => void;
  onOrderDirectionToggle: () => void;
  playSfx: (name: HubModuleSfxId) => void;
  tutorialActions?: IMarketTutorialActions;
}

/**
 * Mantiene consistentes los controles de filtros entre variantes desktop y móvil.
 */
export function MarketHeaderFilters(props: IMarketHeaderFiltersProps) {
  const directionButtonClassName = props.isMobile
    ? "mt-[16px] flex h-[38px] items-center justify-center gap-1 rounded-lg border border-cyan-500/40 bg-[linear-gradient(180deg,rgba(4,34,56,0.8),rgba(3,22,38,0.9))] px-3"
    : "flex h-[38px] mt-[16px] items-center justify-center gap-1 rounded-lg border border-cyan-500/40 bg-[linear-gradient(180deg,rgba(4,34,56,0.8),rgba(3,22,38,0.9))] px-3 shadow-[inset_0_0_10px_rgba(34,211,238,0.1)] hover:border-cyan-300/80 shrink-0 relative z-30";

  return (
    <>
      <div data-tutorial-id="market-type-filter" className={props.isMobile ? "" : "w-[110px] sm:w-[120px] shrink-0 relative z-50"}>
        <GameSelect
          label="TIPO"
          value={props.typeFilter}
          onChange={(value) => {
            props.onTypeFilterChange(value as MarketTypeFilter);
            props.tutorialActions?.onTypeFilterChange?.();
          }}
          onOpen={() => props.playSfx("FILTER_OPEN")}
          onClose={() => props.playSfx("FILTER_CLOSE")}
          ariaLabel="Filtro de tipo"
          Icon={ListFilter}
          options={MARKET_TYPE_OPTIONS}
        />
      </div>
      <div data-tutorial-id="market-order-filter" className={props.isMobile ? "" : "w-[110px] sm:w-[120px] shrink-0 relative z-40"}>
        <GameSelect
          label="ORDEN"
          value={props.orderField}
          onChange={(value) => {
            props.onOrderFieldChange(value as MarketOrderField);
            props.tutorialActions?.onOrderFieldChange?.();
          }}
          onOpen={() => props.playSfx("FILTER_OPEN")}
          onClose={() => props.playSfx("FILTER_CLOSE")}
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
        whileHover={props.isMobile ? undefined : { scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={directionButtonClassName}
      >
        <motion.div animate={{ rotate: props.orderDirection === "ASC" ? 0 : 180 }}>
          <ArrowDownUp size={14} className={props.isMobile ? "text-cyan-300" : "text-cyan-400"} />
        </motion.div>
      </motion.button>
    </>
  );
}
