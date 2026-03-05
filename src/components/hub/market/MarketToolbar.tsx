// src/components/hub/market/MarketToolbar.tsx - Barra de búsqueda y filtros del catálogo del mercado.
"use client";

import { ArrowDownUp, Layers3, ListFilter, Search } from "lucide-react";
import { GameSelect } from "@/components/ui/GameSelect";
import {
  MarketOrderDirection,
  MarketOrderField,
  MarketTypeFilter,
} from "@/components/hub/market/market-filters";

interface MarketToolbarProps {
  nameQuery: string;
  typeFilter: MarketTypeFilter;
  orderField: MarketOrderField;
  orderDirection: MarketOrderDirection;
  onNameQueryChange: (value: string) => void;
  onTypeFilterChange: (value: MarketTypeFilter) => void;
  onOrderFieldChange: (value: MarketOrderField) => void;
  onOrderDirectionToggle: () => void;
}

export function MarketToolbar(props: MarketToolbarProps) {
  return (
    <div className="mt-3 grid w-full gap-2 xl:grid-cols-[1fr_auto]">
      <label className="flex items-center gap-2 border border-cyan-500/35 bg-[#071a2f]/90 px-3 py-2">
        <Search size={14} className="text-cyan-300" />
        <input
          aria-label="Buscar carta por nombre"
          value={props.nameQuery}
          onChange={(event) => props.onNameQueryChange(event.target.value)}
          className="w-full bg-transparent text-sm outline-none placeholder:text-cyan-100/50"
          placeholder="Buscar por nombre..."
        />
      </label>
      <div className="ml-auto flex gap-2">
        <GameSelect
          label="Tipo"
          value={props.typeFilter}
          onChange={(value) => props.onTypeFilterChange(value as MarketTypeFilter)}
          ariaLabel="Filtro de tipo"
          Icon={ListFilter}
          options={[
            { value: "ALL", label: "Todos" },
            { value: "ENTITY", label: "Entidad" },
            { value: "EXECUTION", label: "Magia" },
            { value: "TRAP", label: "Trampa" },
            { value: "FUSION", label: "Fusión" },
            { value: "ENVIRONMENT", label: "Entorno" },
          ]}
        />
        <GameSelect
          label="Ordenar"
          value={props.orderField}
          onChange={(value) => props.onOrderFieldChange(value as MarketOrderField)}
          ariaLabel="Campo de orden"
          Icon={Layers3}
          options={[
            { value: "PRICE", label: "Precio" },
            { value: "ENERGY", label: "Energía" },
            { value: "ATTACK", label: "Ataque" },
            { value: "DEFENSE", label: "Defensa" },
            { value: "NAME", label: "Nombre" },
          ]}
        />
        <button
          type="button"
          aria-label="Cambiar dirección de orden"
          onClick={props.onOrderDirectionToggle}
          className="flex h-[52px] items-center gap-1 border border-cyan-500/45 bg-[#082338] px-3 text-xs font-black uppercase tracking-wider"
        >
          {props.orderDirection === "ASC" ? "Asc" : "Desc"} <ArrowDownUp size={13} />
        </button>
      </div>
    </div>
  );
}
