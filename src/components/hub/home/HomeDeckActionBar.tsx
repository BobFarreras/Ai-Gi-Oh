// src/components/hub/home/HomeDeckActionBar.tsx
import { motion } from "framer-motion";
import { HomeCollectionOrderDirection, HomeCollectionOrderField, HomeCollectionTypeFilter } from "@/components/hub/home/home-filters";
import { GameSelect } from "@/components/ui/GameSelect";
import { ArrowDownUp, Layers3, ListFilter, Download, Upload, Save } from "lucide-react";
import { BackButton } from "@/components/ui/BackButton"; // <-- NUEVA IMPORTACIÓN

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

export function HomeDeckActionBar({ canInsert, canRemove, typeFilter, orderField, orderDirection, onChangeTypeFilter, onChangeOrderField, onToggleOrderDirection, onInsert, onRemove, onSave }: HomeDeckActionBarProps) {
  
  const buttonBaseClass = "relative flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg border font-black uppercase tracking-widest text-[10px] sm:text-xs transition-all duration-300 backdrop-blur-md overflow-hidden group shrink-0";

  return (
    <header className="relative flex w-full flex-col xl:flex-row xl:items-center justify-between gap-4 bg-[#041120]/90 border border-cyan-800/50 p-3 sm:px-5 sm:py-3 rounded-xl shadow-[0_0_20px_rgba(8,145,178,0.15),inset_0_0_20px_rgba(0,0,0,0.6)] backdrop-blur-xl overflow-hidden z-10">
      
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgba(34,211,238,0.05),transparent_45%,rgba(59,130,246,0.05))]" />

      {/* 1. SECCIÓN IZQUIERDA: Título y Contexto */}
      {/* REFACTOR: Cambiado a items-center e inyectado el BackButton */}
      <div className="relative flex items-center gap-3 pr-2 xl:pr-6 xl:border-r border-cyan-900/60">
        
        <BackButton href="/hub" label="Menú" className="mr-1 xs:flex" />

        <h1 className="text-xl sm:text-2xl font-black uppercase tracking-widest text-cyan-100 drop-shadow-[0_0_10px_rgba(34,211,238,0.6)] whitespace-nowrap">
          Mi Home
        </h1>
        <span className="text-cyan-500/50 select-none hidden sm:inline">|</span>
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-300/60 hidden md:block whitespace-nowrap">
          Deck Hub
        </p>
      </div>

      {/* ... (El resto del código de la Barra Maestra sigue exactamente igual) ... */}
      <div className="relative flex flex-1 flex-wrap lg:flex-nowrap items-center justify-between gap-4">
        
        {/* 2. SECCIÓN CENTRAL: Acciones Principales */}
        <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto home-modern-scroll pb-1 lg:pb-0 w-full lg:w-auto">
          {/* BOTÓN INTRODUCIR */}
          <motion.button
            type="button"
            aria-label="Introducir carta seleccionada en el deck"
            disabled={!canInsert}
            onClick={onInsert}
            whileHover={canInsert ? { scale: 1.02 } : {}}
            whileTap={canInsert ? { scale: 0.95 } : {}}
            className={`${buttonBaseClass} ${
              canInsert
                ? "border-cyan-500/50 bg-cyan-950/40 text-cyan-300 hover:border-cyan-300 hover:bg-cyan-900/60 hover:shadow-[0_0_15px_rgba(34,211,238,0.4)] cursor-pointer"
                : "border-zinc-800 bg-zinc-950/50 text-zinc-600 cursor-not-allowed"
            }`}
          >
            {canInsert && <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/10 to-cyan-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />}
            <Upload size={16} className={canInsert ? "text-cyan-400 group-hover:-translate-y-1 transition-transform" : "text-zinc-600"} />
            <span>Añadir</span>
          </motion.button>

          {/* BOTÓN SACAR */}
          <motion.button
            type="button"
            aria-label="Sacar carta seleccionada del deck"
            disabled={!canRemove}
            onClick={onRemove}
            whileHover={canRemove ? { scale: 1.02 } : {}}
            whileTap={canRemove ? { scale: 0.95 } : {}}
            className={`${buttonBaseClass} ${
              canRemove
                ? "border-red-500/50 bg-red-950/40 text-red-300 hover:border-red-400 hover:bg-red-900/60 hover:shadow-[0_0_15px_rgba(239,68,68,0.4)] cursor-pointer"
                : "border-zinc-800 bg-zinc-950/50 text-zinc-600 cursor-not-allowed"
            }`}
          >
            {canRemove && <div className="absolute inset-0 bg-gradient-to-r from-red-500/0 via-red-500/10 to-red-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />}
            <Download size={16} className={canRemove ? "text-red-400 group-hover:translate-y-1 transition-transform" : "text-zinc-600"} />
            <span>Remover</span>
          </motion.button>

          <div className="w-px h-6 bg-cyan-900/50 mx-1 hidden sm:block" />

          {/* BOTÓN GUARDAR */}
          <motion.button
            type="button"
            aria-label="Guardar deck"
            onClick={onSave}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative flex items-center gap-2 px-5 py-2 sm:py-2.5 rounded-lg border border-emerald-500/60 bg-emerald-950/50 font-black uppercase tracking-widest text-[10px] sm:text-xs text-emerald-300 transition-all duration-300 hover:border-emerald-300 hover:bg-emerald-900/80 hover:shadow-[0_0_20px_rgba(16,185,129,0.5)] overflow-hidden group shrink-0"
          >
            <div className="absolute -inset-full h-full w-1/2 z-0 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-10 group-hover:animate-[shine_1.5s_infinite]" />
            <Save size={16} className="text-emerald-400 relative z-10" />
            <span className="relative z-10">Compilar</span>
          </motion.button>
        </div>

        {/* 3. SECCIÓN DERECHA: Filtros y Selectores */}
        <div className="flex shrink-0 items-center gap-2 sm:gap-3 w-full lg:w-auto justify-end">
          <GameSelect
            label="TIPO"
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
            label="ORDEN"
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
          
          <motion.button
            type="button"
            aria-label="Cambiar dirección de orden"
            onClick={onToggleOrderDirection}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex h-[42px] mt-[18px] items-center justify-center gap-1 rounded-xl border border-cyan-500/40 bg-[linear-gradient(180deg,rgba(4,34,56,0.8),rgba(3,22,38,0.9))] px-3 sm:px-4 text-xs font-black uppercase tracking-wider text-cyan-200 shadow-[inset_0_0_10px_rgba(34,211,238,0.1)] transition-all hover:border-cyan-300/80 hover:text-white"
          >
            <motion.div animate={{ rotate: orderDirection === "ASC" ? 0 : 180 }}>
              <ArrowDownUp size={14} className="text-cyan-400" />
            </motion.div>
          </motion.button>
        </div>
        
      </div>
    </header>
  );
}