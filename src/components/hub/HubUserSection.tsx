// src/components/hub/HubUserSection.tsx - Widget HUD que muestra identidad activa del jugador en el hub.
"use client";

import { Fingerprint } from "lucide-react";

interface HubUserSectionProps {
  playerLabel: string;
}

export function HubUserSection({ playerLabel }: HubUserSectionProps) {
  return (
    <section
      className="group relative flex w-[196px] items-center gap-2 border border-cyan-500/40 bg-[#010a14]/90 p-2 shadow-[0_0_30px_rgba(6,182,212,0.15)] backdrop-blur-md transition-all hover:border-cyan-400/80 hover:bg-[#021224]/95 sm:w-[280px] sm:gap-4 sm:p-3"
      style={{ clipPath: "polygon(15px 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%, 0 15px)" }}
    >
      {/* Scanline overlay de fondo */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] opacity-30" />

      {/* 1. MÓDULO BIOMÉTRICO (Izquierda) */}
      <div 
        className="relative flex h-10 w-10 shrink-0 overflow-hidden items-center justify-center border border-cyan-400/50 bg-cyan-950/40 shadow-[inset_0_0_10px_rgba(6,182,212,0.3)] sm:h-14 sm:w-14"
        style={{ clipPath: "polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)" }}
      >
        <Fingerprint className="h-5 w-5 text-cyan-400 opacity-80 sm:h-7 sm:w-7" />
        
    
      </div>

      {/* 2. DATOS DEL USUARIO (Derecha) */}
      <div className="relative z-10 flex flex-col justify-center overflow-hidden">
        <h3 className="font-mono text-[8px] font-black uppercase tracking-[0.16em] text-cyan-500 sm:text-[9px] sm:tracking-[0.2em]">
          Operador Identificado
        </h3>
        
        {/* Nombre del jugador */}
        <p className="mt-0.5 truncate font-mono text-[11px] font-black uppercase tracking-[0.12em] text-cyan-50 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)] sm:text-sm sm:tracking-widest">
          {playerLabel}
        </p>
        
        {/* Indicador de estado de red */}
        <div className="mt-1 flex items-center gap-1.5">
          <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400 shadow-[0_0_5px_rgba(52,211,153,0.8)]" />
          <span className="hidden font-mono text-[8px] uppercase tracking-widest text-emerald-400/80 sm:inline">
            Neural Link: Estable
          </span>
        </div>
      </div>

      {/* Detalles industriales: Pequeñas muescas decorativas en la esquina */}
      <div className="absolute bottom-1 right-2 flex gap-1">
        <div className="h-1 w-1 bg-cyan-500/50" />
        <div className="h-1 w-1 bg-cyan-500/50" />
        <div className="h-1 w-3 bg-cyan-500/80" />
      </div>
    </section>
  );
}
