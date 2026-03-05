// src/components/hub/market/MarketCardInspector.tsx - Muestra el detalle de carta seleccionada y compra contextual en el mercado.
"use client";

import { motion } from "framer-motion";
import { Zap, Swords, Shield, Tag, Lock, ShoppingCart, ScanLine } from "lucide-react";
import { ICard } from "@/core/entities/ICard";
import { IMarketCardListing } from "@/core/entities/market/IMarketCardListing";
import { Card } from "@/components/game/card/Card";

interface MarketCardInspectorProps {
  selectedCard: ICard | null;
  selectedListing: IMarketCardListing | null;
  onBuyCard: (listingId: string) => Promise<void>;
}

export function MarketCardInspector({ selectedCard, selectedListing, onBuyCard }: MarketCardInspectorProps) {
  return (
    <aside className="flex flex-col h-full overflow-hidden p-4 relative">
      <h2 className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-cyan-500/80 shrink-0">
        Inspección de Datos
      </h2>

      {selectedCard ? (
        <>
          <div className="home-modern-scroll flex-1 overflow-y-auto pr-2 pb-4">

            {/* Contenedor 3D de la Carta */}
            <div className="relative flex justify-center items-center w-full h-[260px] sm:h-[300px] mb-4 perspective-1000">
              <motion.div
                whileHover={{ scale: 1.05, rotateY: 5, rotateX: 5 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="relative origin-center scale-[0.55] sm:scale-[0.65] md:scale-[0.70] shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
              >
                <div className="absolute -inset-4 bg-cyan-400/20 blur-2xl rounded-full opacity-0 hover:opacity-100 transition-opacity duration-500" />
                <Card card={selectedCard} />
              </motion.div>
            </div>

            <h3 className="text-xl sm:text-2xl font-black uppercase text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.3)] leading-tight">
              {selectedCard.name}
            </h3>

            {/* Módulos de Estadísticas (Badges) actualizados */}
            <div className="flex flex-wrap gap-2 mt-3 mb-4">
              {/* REFACTOR: Uso estricto de selectedCard.archetype */}
              <span className="flex items-center gap-1.5 rounded bg-cyan-950/60 border border-cyan-800/50 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-cyan-300">
                <Tag size={12} />
                {selectedCard.type}
                {selectedCard.type === "ENTITY" && selectedCard.archetype && (
                  <span className="text-cyan-100 ml-1 border-l border-cyan-800 pl-1.5">
                    {selectedCard.archetype}
                  </span>
                )}
              </span>

              <span className="flex items-center gap-1.5 rounded bg-amber-950/60 border border-amber-800/50 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-amber-300">
                <Zap size={12} /> Coste {selectedCard.cost}
              </span>

              {selectedCard.attack !== undefined && (
                <span className="flex items-center gap-1.5 rounded bg-rose-950/60 border border-rose-800/50 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-rose-300">
                  <Swords size={12} /> {selectedCard.attack}
                </span>
              )}
              {selectedCard.defense !== undefined && (
                <span className="flex items-center gap-1.5 rounded bg-indigo-950/60 border border-indigo-800/50 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-indigo-300">
                  <Shield size={12} /> {selectedCard.defense}
                </span>
              )}
            </div>

            <p className="text-xs sm:text-sm leading-relaxed text-cyan-100/70 font-medium">
              {selectedCard.description}
            </p>
          </div>

          <div className="mt-auto pt-4 border-t border-cyan-900/50 shrink-0 bg-[#030c16]">
            {selectedListing ? (
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center px-1">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Valor de Mercado</span>
                  <span className={`text-lg font-black font-mono tracking-widest ${selectedListing.isAvailable ? "text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "text-rose-400"}`}>
                    {selectedListing.isAvailable ? `${selectedListing.priceNexus} NX` : "NO DISPONIBLE"}
                  </span>
                </div>

                {/* Botón "Comprar" */}
                <motion.button
                  type="button"
                  disabled={!selectedListing.isAvailable}
                  onClick={() => onBuyCard(selectedListing.id)}
                  whileHover={selectedListing.isAvailable ? { scale: 1.02 } : {}}
                  whileTap={selectedListing.isAvailable ? { scale: 0.98 } : {}}
                  className={`relative w-full flex items-center justify-center gap-2 py-3 sm:py-3.5 rounded-xl border text-xs font-black uppercase tracking-widest transition-all overflow-hidden group ${selectedListing.isAvailable
                      ? "border-emerald-500/50 bg-emerald-950/40 text-emerald-300 hover:border-emerald-300 hover:bg-emerald-900/60 hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] cursor-pointer"
                      : "border-zinc-800 bg-zinc-950/60 text-zinc-500 cursor-not-allowed"
                    }`}
                >
                  {selectedListing.isAvailable ? (
                    <>
                      <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/10 to-emerald-500/0 opacity-0 group-hover:opacity-100 group-hover:animate-[shine_1.5s_infinite] transition-opacity" />
                      <ShoppingCart size={16} className="relative z-10" />
                      <span className="relative z-10">Comprar</span>
                    </>
                  ) : (
                    <>
                      <Lock size={16} className="text-zinc-600" />
                      <span>Exclusivo en Packs</span>
                    </>
                  )}
                </motion.button>
              </div>
            ) : (
              <p className="text-center text-[10px] text-rose-400 uppercase tracking-widest p-2 border border-rose-900/50 bg-rose-950/20 rounded-lg">
                Datos de mercado corruptos.
              </p>
            )}
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center h-full opacity-30">
          <div className="w-[180px] h-[250px] border border-cyan-500/30 border-dashed rounded-xl flex items-center justify-center bg-cyan-950/10">
            <ScanLine className="w-12 h-12 text-cyan-500/50 animate-pulse" />
          </div>
          <p className="mt-6 text-[10px] uppercase tracking-[0.3em] font-black text-cyan-300 text-center">
            Esperando Selección<br />de Datos...
          </p>
        </div>
      )}
    </aside>
  );
}
