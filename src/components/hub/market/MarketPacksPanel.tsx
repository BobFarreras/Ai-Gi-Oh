// src/components/hub/market/MarketPacksPanel.tsx
"use client";

import { motion } from "framer-motion";
import { IMarketPackDefinition } from "@/core/entities/market/IMarketPackDefinition";
import { PackageOpen, X } from "lucide-react";
import { Card } from "@/components/game/card/Card";
import { ICard } from "@/core/entities/ICard";

// Facciones y Tipos 100% compatibles con ICard.ts
const MOSAIC_CARDS: ICard[] = [
  { id: "m1", name: "AI Core", type: "ENTITY", faction: "BIG_TECH", cost: 7, attack: 2500, defense: 2000, description: "" },
  { id: "m2", name: "Logic Bomb", type: "EXECUTION", faction: "NO_CODE", cost: 3, description: "" },
  { id: "m3", name: "Firewall", type: "TRAP", faction: "NEUTRAL", cost: 4, description: "" },
  { id: "m4", name: "Datacenter", type: "ENVIRONMENT", faction: "BIG_TECH", cost: 2, description: "" },
  { id: "m5", name: "Scrap Bot", type: "ENTITY", faction: "OPEN_SOURCE", cost: 1, attack: 500, defense: 1000, description: "" },
  { id: "m6", name: "Trojan", type: "EXECUTION", faction: "OPEN_SOURCE", cost: 5, description: "" },
  { id: "m7", name: "Mainframe", type: "ENTITY", faction: "BIG_TECH", cost: 8, attack: 3000, defense: 3000, description: "" },
  { id: "m8", name: "Bypass", type: "EXECUTION", faction: "OPEN_SOURCE", cost: 2, description: "" },
  { id: "m9", name: "Honeypot", type: "TRAP", faction: "NO_CODE", cost: 3, description: "" },
];

// REFACTOR: Posiciones re-calculadas para cartas más pequeñas (scale-[0.20])
const MOSAIC_POSITIONS = [
  "-top-[20px] -left-[10px] rotate-[-15deg]",
  "-top-[30px] left-[30px] rotate-[10deg]",
  "-top-[15px] left-[70px] rotate-[25deg]",
  "top-[40px] -left-[20px] rotate-[8deg]",
  "top-[50px] left-[25px] rotate-[-12deg]",
  "top-[35px] left-[75px] rotate-[-20deg]",
  "top-[100px] -left-[5px] rotate-[-18deg]",
  "top-[115px] left-[35px] rotate-[15deg]",
  "top-[85px] left-[85px] rotate-[35deg]",
];

interface MarketPacksPanelProps {
  packs: IMarketPackDefinition[];
  selectedPackId: string | null;
  onSelectPack: (packId: string) => void;
  onClearPackSelection: () => void;
  onBuyPack: (packId: string) => Promise<void>;
}

export function MarketPacksPanel({ packs, selectedPackId, onSelectPack, onClearPackSelection, onBuyPack }: MarketPacksPanelProps) {
  const activePack = packs.find(p => p.id === selectedPackId);

  return (
    <section className="flex flex-col h-full rounded-xl border border-cyan-800/35 bg-[#031020]/55 p-3 overflow-hidden">
      
      {/* CABECERA */}
      <div className="flex items-center justify-between gap-3 mb-3 shrink-0 border-b border-cyan-900/50 pb-2">
        <button
          type="button"
          onClick={onClearPackSelection}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all ${
            selectedPackId === null 
              ? "border-cyan-400 bg-cyan-950/80 text-cyan-100 shadow-[0_0_10px_rgba(34,211,238,0.3)] cursor-default" 
              : "border-cyan-800/50 text-cyan-500 hover:border-cyan-400 hover:text-cyan-200 bg-[#020a14]/60 cursor-pointer"
          }`}
        >
          {selectedPackId !== null && <X size={12} />}
          Cartas Sueltas
        </button>

        {activePack ? (
          <motion.button
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            type="button"
            onClick={() => onBuyPack(activePack.id)}
            className="relative flex items-center gap-2 rounded-lg border border-fuchsia-400/60 bg-fuchsia-900/40 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-fuchsia-200 shadow-[0_0_15px_rgba(192,38,211,0.2)] hover:bg-fuchsia-800/60 transition-all group overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shine_1s_infinite]" />
            <PackageOpen size={14} className="text-fuchsia-300" />
            Adquirir x {activePack.priceNexus} NX
          </motion.button>
        ) : (
          <span className="text-[9px] uppercase tracking-widest text-cyan-500/50 pr-2">
            Selecciona un Pack
          </span>
        )}
      </div>

      {/* LISTADO DE SOBRES */}
      <div className="home-modern-scroll min-h-0 flex-1 overflow-x-auto overflow-y-hidden pb-2 pr-2">
        <div className="flex h-full items-center gap-4 w-max min-w-full">
          
          {packs.map((pack) => {
            const isSelected = selectedPackId === pack.id;
            return (
              <button
                key={pack.id}
                type="button"
                aria-label={`Seleccionar ${pack.name}`}
                onClick={() => onSelectPack(pack.id)}
                // REFACTOR: Eliminado el grayscale. Ahora los colores se ven siempre.
                className={`relative shrink-0 w-[100px] sm:w-[110px] aspect-[3/4] rounded-lg border-2 text-left overflow-hidden transition-all duration-300 ${
                  isSelected 
                    ? "border-fuchsia-400 shadow-[0_0_20px_rgba(192,38,211,0.6)] z-20 scale-[1.02]" 
                    : "border-cyan-800/60 shadow-lg z-10 hover:border-cyan-400 hover:shadow-[0_0_15px_rgba(34,211,238,0.3)]"
                }`}
              >
                
                {/* FONDO MOSAICO ARREGLADO */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-lg bg-[#01060d]">
                  
                  {/* Contenedor de las cartas */}
                  <div className="absolute inset-0 z-0">
                    {MOSAIC_POSITIONS.map((pos, index) => (
                      <div 
                        key={index} 
                        // REFACTOR CLAVE: scale-[0.20] (cartas más pequeñas) y opacity-100 (100% visibles)
                        className={`absolute w-[260px] h-[340px] ${pos} origin-top-left scale-[0.20] opacity-100`}
                      >
                        <Card card={MOSAIC_CARDS[index]} />
                      </div>
                    ))}
                  </div>

                  {/* REFACTOR: Tintado de color muy suave (30% inactivo, 20% activo fucsia) */}
                  <div className={`absolute inset-0 z-10 transition-colors duration-500 ${isSelected ? 'bg-fuchsia-600/20' : 'bg-cyan-900/30'}`} />
                  
                  {/* REFACTOR: Gradient negro menos agresivo, solo abajo para que se lea el precio */}
                  <div className="absolute inset-0 z-20 backdrop-blur-[0.5px] bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                </div>

                {/* CONTENIDO FRONTAL DEL PACK */}
                <div className="relative z-30 flex flex-col h-full justify-between p-2">
                  
                  {/* Etiqueta de cantidad de datos */}
                  <div className="text-center bg-black/60 rounded border border-white/10 py-0.5 backdrop-blur-md shadow-lg mx-1 mt-1">
                    <p className={`text-[8px] font-black uppercase tracking-widest ${isSelected ? 'text-fuchsia-300' : 'text-cyan-300'}`}>
                      {pack.cardsPerPack} Datos
                    </p>
                  </div>

                  {/* Título y Logotipo Central */}
                  <div className="flex flex-col items-center justify-center mt-2">
                    <div className={`p-2 rounded-full backdrop-blur-sm bg-black/30 border ${isSelected ? 'border-fuchsia-400/50' : 'border-cyan-400/30'}`}>
                      <PackageOpen size={20} className={isSelected ? 'text-fuchsia-300 drop-shadow-[0_0_8px_rgba(192,38,211,0.8)]' : 'text-cyan-300'} />
                    </div>
                    <h3 className="text-[11px] font-black uppercase text-center text-white leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] mt-2 bg-black/50 px-2 py-1 rounded backdrop-blur-sm">
                      {pack.name}
                    </h3>
                  </div>

                  {/* Precio Inferior */}
                  <div className={`mt-auto text-center py-1.5 -mx-2 bg-black/80 backdrop-blur-md border-t shadow-[0_-5px_15px_rgba(0,0,0,0.6)] ${isSelected ? 'border-fuchsia-500/80' : 'border-cyan-800/80'}`}>
                    <p className="text-[10px] font-black text-emerald-400 tracking-widest drop-shadow-[0_0_5px_rgba(16,185,129,0.5)]">
                      {pack.priceNexus} NX
                    </p>
                  </div>

                </div>
              </button>
            );
          })}

        </div>
      </div>

    </section>
  );
}