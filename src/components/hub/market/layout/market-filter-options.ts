// src/components/hub/market/layout/market-filter-options.ts - Opciones reutilizables para filtros de tipo y orden del mercado.
export const MARKET_TYPE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "ALL", label: "Todos" },
  { value: "ENTITY", label: "Entidad" },
  { value: "EXECUTION", label: "Magia" },
  { value: "TRAP", label: "Trampa" },
] as const;

export const MARKET_ORDER_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "PRICE", label: "Precio" },
  { value: "ENERGY", label: "Energía" },
  { value: "NAME", label: "Nombre" },
] as const;
