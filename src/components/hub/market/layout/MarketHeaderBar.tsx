// src/components/hub/market/layout/MarketHeaderBar.tsx - Cabecera del mercado con saldo Nexus, búsqueda y filtros principales.
"use client";

import { motion } from "framer-motion";
import { ArrowDownUp, Layers3, ListFilter, Search } from "lucide-react";
import { GameSelect } from "@/components/ui/GameSelect";
import { BackButton } from "@/components/ui/BackButton";
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
}

export function MarketHeaderBar(props: MarketHeaderBarProps) {
  return (
    // IMPORTANTE: overflow-visible es imperativo aquí para que los selects puedan salir del header
    <header className="relative w-full bg-[#041120]/90 border border-cyan-800/50 p-2 sm:px-4 sm:py-2.5 rounded-xl shadow-[0_0_20px_rgba(8,145,178,0.15),inset_0_0_20px_rgba(0,0,0,0.6)] backdrop-blur-xl z-[100] overflow-visible">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgba(34,211,238,0.05),transparent_45%,rgba(59,130,246,0.05))] rounded-xl" />

      <div className="relative grid gap-4 xl:grid-cols-[1fr_1.8fr_1.2fr] items-center overflow-visible">
        
        {/* 1. SECCIÓN IZQUIERDA (1fr) */}
        <div className="flex items-center gap-3 xl:border-r border-cyan-900/60 xl:pr-4 min-w-0">
          <BackButton href="/hub" label="" className="flex shrink-0 px-2 py-1.5" />
          <h1 className="text-lg font-black uppercase tracking-widest text-cyan-100 drop-shadow-[0_0_10px_rgba(34,211,238,0.6)] truncate hidden sm:block">
            Mercado
          </h1>
          <div className="ml-auto flex items-center justify-center px-3 py-1 bg-[#020a14]/90 border border-emerald-500/40 rounded-lg shadow-[inset_0_0_15px_rgba(0,0,0,0.8)] shrink-0">
            <span className="text-sm font-black text-emerald-400 font-mono tracking-widest drop-shadow-[0_0_5px_rgba(16,185,129,0.5)]">
              {props.walletBalance} <span className="text-emerald-600 text-[10px] ml-0.5">NX</span>
            </span>
          </div>
        </div>

        {/* 2. SECCIÓN CENTRAL (1.8fr) */}
        <div className="flex items-center min-w-0">
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
        </div>

        {/* 3. SECCIÓN DERECHA (1.2fr) */}
        {/* Usamos gap-y-3 para que si saltan de línea tengan espacio y no se solapen */}
        <div className="flex flex-wrap items-center justify-start xl:justify-end gap-x-2 gap-y-3 min-w-0 overflow-visible">
          
          {/* z-50 para que este menú caiga por encima del de la derecha */}
          <div className="w-[110px] sm:w-[120px] shrink-0 relative z-50">
            <GameSelect
              label="TIPO"
              value={props.typeFilter}
              onChange={(value) => props.onTypeFilterChange(value as MarketTypeFilter)}
              ariaLabel="Filtro de tipo"
              Icon={ListFilter}
              options={[
                { value: "ALL", label: "Todos" },
                { value: "ENTITY", label: "Entidad" },
                { value: "EXECUTION", label: "Magia" },
                { value: "TRAP", label: "Trampa" },
              ]}
            />
          </div>
          
          {/* z-40 para que esté por debajo del Tipo pero por encima de los botones */}
          <div className="w-[110px] sm:w-[120px] shrink-0 relative z-40">
            <GameSelect
              label="ORDEN"
              value={props.orderField}
              onChange={(value) => props.onOrderFieldChange(value as MarketOrderField)}
              ariaLabel="Campo de orden"
              Icon={Layers3}
              options={[
                { value: "PRICE", label: "Precio" },
                { value: "ENERGY", label: "Energía" },
                { value: "NAME", label: "Nombre" },
              ]}
            />
          </div>
          
          <motion.button
            type="button"
            onClick={props.onOrderDirectionToggle}
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
    </header>
  );
}
