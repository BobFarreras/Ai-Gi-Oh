// src/components/game/card/internal/CardHologram.tsx - Renderiza la capa holográfica animada de cartas en tablero.
"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Shield, Sword, Zap } from "lucide-react";
import { ICard } from "@/core/entities/ICard";
import { cn } from "@/lib/utils";

interface CardHologramProps {
  card: ICard;
  isDefense: boolean;
  mode?: "full" | "lite";
  className?: string;
}

export function CardHologram({ card, isDefense, mode = "full", className }: CardHologramProps) {
  const isExecution = card.type === "EXECUTION";

  if (!card.renderUrl) {
    return null;
  }

  if (mode === "lite") {
    return (
      <div
        className={cn("absolute inset-0 z-50 pointer-events-none", className)}
        style={{ transformStyle: "preserve-3d", transform: "translateZ(12px)" }}
      >
        <div className="absolute inset-0 rounded-xl bg-cyan-500/8" />
        <div className="absolute left-1/2 top-[10%] h-[72%] w-[72%] -translate-x-1/2 rounded-full bg-cyan-400/20 blur-2xl" />
        <Image
          src={card.renderUrl}
          alt={`Render de ${card.name}`}
          fill
          sizes="180px"
          quality={45}
          className="object-contain opacity-85 drop-shadow-[0_0px_12px_rgba(0,0,0,0.7)]"
        />
      </div>
    );
  }

  return (
    // 1. LA BASE ESTÁTICA: Usamos un <div> normal para que Framer no borre el translateZ(20px)
    <div 
      className={cn("absolute inset-0 z-50 pointer-events-none", className)} 
      style={{ transformStyle: "preserve-3d", transform: "translateZ(20px)" }}
    >
      {/* CAPA 1 (ANTI-GIRO) */}
      <motion.div
        className="absolute inset-0 w-full h-full"
        style={{ transformOrigin: "center center", transformStyle: "preserve-3d" }}
        initial={{ rotateZ: 0 }}
        animate={{ rotateZ: isDefense ? 90 : 0 }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
      >
        
        {/* CAPA 2 (INCLINACIÓN Y CRECIMIENTO HOLOGRÁFICO AAA):
            Al aplicar el scale desde el `bottom center` de esta capa inclinada,
            logramos exactamente el efecto de "haz de luz" que se abre desde
            la base hacia el cielo (Pirámide invertida).
        */}
        <motion.div
          className="relative w-full h-full"
          style={{ transformOrigin: "bottom center", transformStyle: "preserve-3d" }}
          // Inicia minúsculo (0.05), hundido en la base (y: 60) y transparente
          initial={{ rotateX: -55, scale: 0.05, y: 60, opacity: 0 }}
          // Crece a tamaño real, sube a su posición y se vuelve opaco
          animate={{ rotateX: -55, scale: 1, y: 0, opacity: 1 }} 
          // Física de Muelle: Entrada rápida que frena de golpe con un rebote microscópico
          transition={{ type: "spring", damping: 18, stiffness: 120, mass: 0.8 }}
        >
          
          {/* Sombra de anclaje */}
          <div 
            className="absolute left-1/2 bottom-[5px] -translate-x-1/2 w-[220px] h-[30px] bg-black/85 blur-xl rounded-full"
            style={{ transform: "translateZ(-10px)" }}
          />

          {/* IMAGEN VIVA Y MASIVA */}
          <motion.div 
            className="absolute left-1/2 bottom-[95%] -translate-x-1/2 w-[420px] h-[420px] flex items-end justify-center"
            style={{ transformStyle: "preserve-3d" }}
            animate={{ y: [0, -12, -4, -15, 0] }}
            transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
          >
            <div 
              className="absolute w-[90%] h-[90%] bg-cyan-500/25 blur-[60px] rounded-full mix-blend-screen" 
              style={{ transform: "translateZ(10px)" }} 
            />
            
            <Image
              src={card.renderUrl}
              alt={`Render de ${card.name}`}
              fill
              className="object-contain drop-shadow-[0_0px_35px_rgba(0,0,0,0.9)]"
              style={{ transform: "translateZ(40px)" }}
            />
          </motion.div>

          {/* COLUMNA DE ATRIBUTOS (HUD 2D) */}
          <div 
            className="absolute left-1/2 bottom-[75%] -translate-x-1/2 flex flex-col gap-3 w-full"
            style={{ transform: "translateZ(100px) rotateX(55deg)" }}
          >
            <StatRow 
              icon={<Zap className="w-12 h-12 text-yellow-400 fill-yellow-400/30" />} 
              value={card.cost} 
              colorClass="text-yellow-400" 
            />
            
            {!isExecution && (
              <>
                <StatRow 
                  icon={<Sword className="w-12 h-12 text-red-500 fill-red-500/30" />} 
                  value={card.attack ?? 0} 
                  colorClass="text-red-500" 
                />
                <StatRow 
                  icon={<Shield className="w-12 h-12 text-blue-500 fill-blue-500/30" />} 
                  value={card.defense ?? 0} 
                  colorClass="text-blue-500" 
                />
              </>
            )}
          </div>

        </motion.div>
      </motion.div>
    </div>
  );
}

/**
 * Grid de dos columnas que asegura que los iconos formen una línea vertical perfecta.
 */
function StatRow({ icon, value, colorClass }: { icon: React.ReactNode; value: number; colorClass: string }) {
  return (
    <div className="grid grid-cols-[3rem_1fr] items-center gap-6 drop-shadow-[0_8px_12px_rgba(0,0,0,1)]">
      <div className="flex justify-center">
        {icon}
      </div>
      <span className={`font-black text-6xl tracking-tighter text-left ${colorClass} [text-shadow:_0_5px_20px_#000,_0_0_15px_#000,_0_0_5px_#000]`}>
        {value}
      </span>
    </div>
  );
}
