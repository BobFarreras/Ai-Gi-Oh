// src/components/game/board/battlefield/internal/ExecutionActivateButton.tsx
"use client";

import { Power } from "lucide-react"; // Cambiamos Play por Power (System Override)
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useBoardPerformanceProfile } from "@/components/game/board/internal/use-board-performance-profile";

interface ExecutionActivateButtonProps {
  onActivateSelectedExecution: () => void;
}

export function ExecutionActivateButton({ onActivateSelectedExecution }: ExecutionActivateButtonProps) {
  const { shouldReduceCombatEffects } = useBoardPerformanceProfile();

  if (shouldReduceCombatEffects) {
    return (
      <button
        aria-label="Activar ejecución seleccionada"
        onClick={(event) => {
          event.stopPropagation();
          onActivateSelectedExecution();
        }}
        className="absolute top-1/2 left-1/2 z-[120] flex h-24 w-24 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-fuchsia-300/70 bg-fuchsia-900/80 text-fuchsia-100 shadow-[0_10px_24px_rgba(217,70,239,0.45)]"
      >
        <Power size={38} />
      </button>
    );
  }

  return (
    <motion.button
      // Entrada con Z aún más alto
      initial={{ scale: 0, opacity: 0, z: 80, rotateX: 30 }}
      animate={{ scale: 1, opacity: 1, z: 80, rotateX: 0 }}
      exit={{ scale: 0, opacity: 0, z: 0 }}
      // Hover ULTRA agresivo: Crece un 25% (1.25) y se levanta en Z brutalmente
      whileHover={{ scale: 1.25, z: 120, rotateX: 20, rotateY: -10, filter: "brightness(1.3)" }}
      whileTap={{ scale: 0.9, z: 40, rotateX: -10 }}
      transition={{ type: "spring", stiffness: 350, damping: 15 }} // Menos damping = Más rebote
      aria-label="Activar ejecución seleccionada"
      onClick={(event) => {
        event.stopPropagation();
        onActivateSelectedExecution();
      }}
      style={{ transformStyle: "preserve-3d" }}
      className={cn(
        "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
        "flex h-40 w-40 items-center justify-center rounded-full cursor-pointer group", // TAMAÑO TITÁNICO
        "bg-gradient-to-br from-fuchsia-500/60 via-fuchsia-900/80 to-zinc-950/90",
        "border-[4px] border-fuchsia-400/80 border-t-fuchsia-200 border-b-fuchsia-950", 
        "shadow-[inset_0_8px_20px_rgba(255,255,255,0.5),inset_0_-8px_25px_rgba(0,0,0,0.8),0_25px_60px_rgba(217,70,239,1)]",
        "backdrop-blur-md"
      )}
    >
      {/* Anillo exterior (Más grueso y con mayor sombra) */}
      <div 
        className="absolute inset-[-16px] rounded-full border-[3px] border-fuchsia-400/40 animate-[spin_4s_linear_infinite] border-t-transparent shadow-[0_0_20px_rgba(217,70,239,0.6)] pointer-events-none" 
        style={{ transform: "translateZ(-20px)" }} 
      />
      
      {/* Anillo interior (Contrarrotación) */}
      <div 
        className="absolute inset-[10px] rounded-full border-[4px] border-fuchsia-300/60 animate-[spin_3s_linear_infinite_reverse] border-b-transparent pointer-events-none" 
        style={{ transform: "translateZ(15px)" }} 
      />
      
      {/* Centro: Icono Power (System Activate) */}
      <div 
        className="relative flex items-center justify-center w-full h-full pointer-events-none" 
        style={{ transform: "translateZ(40px)" }} // Muy despegado de la base
      >
        <Power 
          size={72} // Icono inmenso
          className="text-fuchsia-50 drop-shadow-[0_0_35px_rgba(255,255,255,1)] group-hover:animate-pulse transition-all" 
        />
      </div>

      {/* Etiqueta flotante inferior (Más grande y separada) */}
      <span 
        className="absolute -bottom-12 text-xl font-black tracking-[0.4em] text-fuchsia-200 drop-shadow-[0_5px_20px_rgba(217,70,239,1)] group-hover:text-white transition-colors pointer-events-none" 
        style={{ transform: "translateZ(50px)" }} 
      >
        ACTIVAR
      </span>
    </motion.button>
  );
}
