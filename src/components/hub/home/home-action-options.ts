// src/components/hub/home/home-action-options.ts - Opciones reutilizables de filtros y orden para la barra de acciones de Arsenal.
export const HOME_TYPE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "ALL", label: "Todos" },
  { value: "ENTITY", label: "Entidad" },
  { value: "EXECUTION", label: "Magia" },
  { value: "TRAP", label: "Trampa" },
  { value: "FUSION", label: "Fusión" },
  { value: "ENVIRONMENT", label: "Entorno" },
];

export const HOME_ORDER_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "NAME", label: "Nombre" },
  { value: "ATTACK", label: "Ataque" },
  { value: "DEFENSE", label: "Defensa" },
  { value: "ENERGY", label: "Energía" },
];
