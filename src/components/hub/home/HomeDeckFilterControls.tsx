// src/components/hub/home/HomeDeckFilterControls.tsx - Bloque de búsqueda y filtros responsive para el almacén de Arsenal.
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowDownUp, Layers3, ListFilter, Search } from "lucide-react";
import { GameSelect } from "@/components/ui/GameSelect";
import { useHubModuleSfx } from "@/components/hub/internal/use-hub-module-sfx";
import {
  HomeCollectionOrderDirection,
  HomeCollectionOrderField,
  HomeCollectionTypeFilter,
} from "@/components/hub/home/home-filters";
import { HOME_ORDER_OPTIONS, HOME_TYPE_OPTIONS } from "@/components/hub/home/home-action-options";

interface HomeDeckFilterControlsProps {
  nameQuery: string;
  typeFilter: HomeCollectionTypeFilter;
  orderField: HomeCollectionOrderField;
  orderDirection: HomeCollectionOrderDirection;
  showDesktopSearch?: boolean;
  onNameQueryChange: (value: string) => void;
  onChangeTypeFilter: (value: HomeCollectionTypeFilter) => void;
  onChangeOrderField: (value: HomeCollectionOrderField) => void;
  onToggleOrderDirection: () => void;
}

export function HomeDeckFilterControls(props: HomeDeckFilterControlsProps) {
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const showDesktopSearch = props.showDesktopSearch ?? true;
  const { play } = useHubModuleSfx();

  return (
    <div className="relative z-30 flex w-full flex-col gap-2">
      <div className="flex items-center gap-2 lg:hidden">
        <label className="flex h-[38px] w-full items-center gap-2 rounded-lg border border-cyan-500/30 bg-[#020a14]/80 px-3">
          <Search size={14} className="shrink-0 text-cyan-400" />
          <input
            aria-label="Buscar carta en almacén"
            value={props.nameQuery}
            onChange={(event) => props.onNameQueryChange(event.target.value)}
            className="w-full truncate bg-transparent text-xs font-medium tracking-wider text-cyan-50 outline-none placeholder:text-cyan-100/40"
            placeholder="BUSCAR CARTA..."
          />
        </label>
        <button
          type="button"
          aria-label="Mostrar filtros del arsenal"
          onClick={() => setIsMobileFiltersOpen((previous) => !previous)}
          className="flex h-[38px] items-center justify-center rounded-lg border border-cyan-500/40 bg-[#021426]/85 px-3 text-[10px] font-black uppercase tracking-[0.16em] text-cyan-200 lg:hidden"
        >
          Filtros
        </button>
      </div>
      <div className="hidden w-full items-end gap-2 lg:flex">
        {showDesktopSearch ? (
          <label className="flex h-[42px] min-w-0 flex-1 items-center gap-2 rounded-lg border border-cyan-500/30 bg-[#020a14]/80 px-3">
            <Search size={14} className="shrink-0 text-cyan-400" />
            <input
              aria-label="Buscar carta en almacén"
              value={props.nameQuery}
              onChange={(event) => props.onNameQueryChange(event.target.value)}
              className="w-full truncate bg-transparent text-xs font-medium tracking-wider text-cyan-50 outline-none placeholder:text-cyan-100/40"
              placeholder="BUSCAR CARTA..."
            />
          </label>
        ) : null}
        <GameSelect
          label="TIPO"
          value={props.typeFilter}
          onChange={(value) => props.onChangeTypeFilter(value as HomeCollectionTypeFilter)}
          onOpen={() => play("FILTER_OPEN")}
          onClose={() => play("FILTER_CLOSE")}
          ariaLabel="Filtrar por tipo"
          Icon={ListFilter}
          options={HOME_TYPE_OPTIONS}
        />
        <GameSelect
          label="ORDEN"
          value={props.orderField}
          onChange={(value) => props.onChangeOrderField(value as HomeCollectionOrderField)}
          onOpen={() => play("FILTER_OPEN")}
          onClose={() => play("FILTER_CLOSE")}
          ariaLabel="Campo de orden"
          Icon={Layers3}
          options={HOME_ORDER_OPTIONS}
        />
        <motion.button
          type="button"
          onClick={props.onToggleOrderDirection}
          whileTap={{ scale: 0.95 }}
          className="mt-[18px] flex h-[42px] items-center justify-center rounded-xl border border-cyan-500/40 bg-[#03182a] px-3 text-cyan-200"
        >
          <motion.div animate={{ rotate: props.orderDirection === "ASC" ? 0 : 180 }}>
            <ArrowDownUp size={14} className="text-cyan-400" />
          </motion.div>
        </motion.button>
      </div>
      {isMobileFiltersOpen ? (
        <div className="grid grid-cols-[1fr_1fr_auto] gap-2 lg:hidden">
          <GameSelect
            label="TIPO"
            value={props.typeFilter}
            onChange={(value) => props.onChangeTypeFilter(value as HomeCollectionTypeFilter)}
            onOpen={() => play("FILTER_OPEN")}
            onClose={() => play("FILTER_CLOSE")}
            ariaLabel="Filtrar por tipo"
            Icon={ListFilter}
            options={HOME_TYPE_OPTIONS}
          />
          <GameSelect
            label="ORDEN"
            value={props.orderField}
            onChange={(value) => props.onChangeOrderField(value as HomeCollectionOrderField)}
            onOpen={() => play("FILTER_OPEN")}
            onClose={() => play("FILTER_CLOSE")}
            ariaLabel="Campo de orden"
            Icon={Layers3}
            options={HOME_ORDER_OPTIONS}
          />
          <button
            type="button"
            aria-label="Cambiar dirección de orden"
            onClick={props.onToggleOrderDirection}
            className="mt-[18px] flex h-[42px] items-center justify-center rounded-xl border border-cyan-500/40 bg-[#03182a] px-3 text-cyan-200"
          >
            <motion.div animate={{ rotate: props.orderDirection === "ASC" ? 0 : 180 }}>
              <ArrowDownUp size={14} className="text-cyan-400" />
            </motion.div>
          </button>
        </div>
      ) : null}
    </div>
  );
}
