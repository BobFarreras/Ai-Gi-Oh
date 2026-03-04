// src/components/hub/home/HomeDeckActionBar.tsx - Barra de acciones principales para introducir, sacar y guardar cartas.
import { HomeCollectionOrderDirection, HomeCollectionOrderField, HomeCollectionTypeFilter } from "@/components/hub/home/home-filters";
import { GameSelect } from "@/components/ui/GameSelect";
import { ArrowDownUp, Layers3, ListFilter } from "lucide-react";

interface HomeDeckActionBarProps {
  canInsert: boolean;
  canRemove: boolean;
  typeFilter: HomeCollectionTypeFilter;
  orderField: HomeCollectionOrderField;
  orderDirection: HomeCollectionOrderDirection;
  onChangeTypeFilter: (value: HomeCollectionTypeFilter) => void;
  onChangeOrderField: (value: HomeCollectionOrderField) => void;
  onToggleOrderDirection: () => void;
  onInsert: () => void;
  onRemove: () => void;
  onSave: () => void;
}

export function HomeDeckActionBar({
  canInsert,
  canRemove,
  typeFilter,
  orderField,
  orderDirection,
  onChangeTypeFilter,
  onChangeOrderField,
  onToggleOrderDirection,
  onInsert,
  onRemove,
  onSave,
}: HomeDeckActionBarProps) {
  const buttonBaseClass =
    "border px-4 py-2 text-xs font-black uppercase tracking-wider transition focus:outline-none focus:ring-2";

  return (
    <div className="flex w-full items-start gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          aria-label="Introducir carta seleccionada en el deck"
          disabled={!canInsert}
          onClick={onInsert}
          className={`${buttonBaseClass} ${
            canInsert
              ? "border-cyan-300/50 bg-cyan-400/10 text-cyan-100 hover:bg-cyan-400/20 focus:ring-cyan-300/40"
              : "border-slate-700 bg-slate-900/60 text-slate-500"
          }`}
        >
          Introducir En Deck
        </button>
        <button
          type="button"
          aria-label="Sacar carta seleccionada del deck"
          disabled={!canRemove}
          onClick={onRemove}
          className={`${buttonBaseClass} ${
            canRemove
              ? "border-rose-300/55 bg-rose-400/10 text-rose-100 hover:bg-rose-400/20 focus:ring-rose-300/45"
              : "border-slate-700 bg-slate-900/60 text-slate-500"
          }`}
        >
          Sacar Del Deck
        </button>
        <button
          type="button"
          aria-label="Guardar deck"
          onClick={onSave}
          className={`${buttonBaseClass} border-emerald-300/55 bg-emerald-400/10 text-emerald-100 hover:bg-emerald-400/20 focus:ring-emerald-300/45`}
        >
          Guardar Deck
        </button>
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-2">
        <GameSelect
          label="Tipo"
          value={typeFilter}
          onChange={(value) => onChangeTypeFilter(value as HomeCollectionTypeFilter)}
          ariaLabel="Filtrar por tipo de carta"
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
          value={orderField}
          onChange={(value) => onChangeOrderField(value as HomeCollectionOrderField)}
          ariaLabel="Campo de orden del almacén"
          Icon={Layers3}
          options={[
            { value: "NAME", label: "Nombre" },
            { value: "ATTACK", label: "Ataque" },
            { value: "DEFENSE", label: "Defensa" },
            { value: "ENERGY", label: "Energía" },
          ]}
        />
        <button
          type="button"
          aria-label="Cambiar dirección de orden"
          onClick={onToggleOrderDirection}
          className="flex h-[52px] items-center gap-1 border border-cyan-500/45 bg-[linear-gradient(160deg,rgba(4,27,44,0.95),rgba(3,16,30,0.98))] px-3 text-xs font-black uppercase tracking-wider text-cyan-100 shadow-[inset_0_0_0_1px_rgba(34,211,238,0.18),0_0_14px_rgba(34,211,238,0.18)] hover:border-cyan-300/80"
        >
          <ArrowDownUp size={13} />
          {orderDirection === "ASC" ? "Ascendente" : "Descendente"}
        </button>
      </div>
    </div>
  );
}
