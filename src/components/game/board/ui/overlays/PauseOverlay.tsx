// src/components/game/board/ui/overlays/PauseOverlay.tsx - Overlay de pausa con acciones de reanudar o abandonar el duelo según modo.
"use client";

import { Play, TriangleAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { BackButton } from "@/components/ui/BackButton";

interface PauseOverlayProps {
  isPaused: boolean;
  onResume: () => void;
  onExit?: () => void;
}

export function PauseOverlay({ isPaused, onResume, onExit }: PauseOverlayProps) {
  const router = useRouter();
  
  if (!isPaused) return null;

  return (
    <div className="absolute inset-0 z-[240] bg-[#020305]/80 backdrop-blur-md flex items-center justify-center pointer-events-auto">
      
      {/* Scanlines Holográficos de fondo para inmersión Cyberpunk */}
      <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] pointer-events-none" />
      
      <div className="relative w-[min(90vw,450px)] rounded-2xl border border-red-500/50 bg-[#0a0202]/95 shadow-[0_0_60px_rgba(239,68,68,0.2),inset_0_0_20px_rgba(239,68,68,0.1)] p-8 text-center flex flex-col items-center overflow-hidden">
        
        {/* Decoración superior - Barra de Alerta */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-70" />
        
        {/* Icono de Alerta Pulsante */}
        <TriangleAlert size={48} className="text-red-500 mb-4 drop-shadow-[0_0_15px_rgba(239,68,68,0.8)] animate-pulse" />

        <p className="text-xs tracking-[0.4em] uppercase font-black text-red-400/80">
          [ Sistema Interrumpido ]
        </p>
        <h2 className="mt-2 text-3xl font-black text-white uppercase tracking-wider drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]">
          Pausa Táctica
        </h2>
        <p className="mt-3 text-sm text-red-200/60 font-mono">
          Advertencia: Abandonar la simulación ahora resultará en la pérdida de progreso no guardado.
        </p>
        
        <div className="mt-8 flex flex-col gap-3 w-full relative z-10">
          
          {/* BOTÓN PRIMARIO: Reanudar */}
          <button
            aria-label="Reanudar partida"
            onClick={(event) => {
              event.stopPropagation();
              onResume();
            }}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-red-500/50 bg-red-500/10 px-4 py-3 text-red-100 font-black uppercase tracking-widest hover:bg-red-500/20 hover:border-red-400 hover:shadow-[0_0_20px_rgba(239,68,68,0.4)] transition-all"
          >
            <Play size={18} className="fill-red-100" />
            Reanudar Simulación
          </button>

          {/* BOTÓN SECUNDARIO: Abandonar (Usando onClick manual para forzar el enrutamiento y evitar bloqueos del Overlay) */}
          <BackButton 
            label="Desconectar y Salir" 
            onClick={() => {
              if (onExit) {
                onExit();
                return;
              }
              router.push("/hub");
            }}
            className="w-full justify-center py-3 border-zinc-800 bg-zinc-900/50 hover:border-red-500/50 hover:bg-red-950/40 hover:text-red-400 group-hover:text-red-400"
          />
          
        </div>
      </div>
    </div>
  );
}
