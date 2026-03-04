// src/components/game/card/internal/CardHologram.tsx - Renderiza el holograma de carta con entrada progresiva desde punto inferior.
"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Shield, Sword, Zap } from "lucide-react";
import { ICard } from "@/core/entities/ICard";
import { cn } from "@/lib/utils";

interface CardHologramProps {
  card: ICard;
  isDefense: boolean;
  className?: string;
}

export function CardHologram({ card, isDefense, className }: CardHologramProps) {
  const isExecution = card.type === "EXECUTION";

  if (!card.renderUrl) {
    return null;
  }

  return (
    <motion.div
      className={cn("absolute inset-0 z-50 pointer-events-none", className)}
      style={{ transformStyle: "preserve-3d", transform: "translateZ(20px)", transformOrigin: "50% 100%" }}
      initial={{ opacity: 0, scale: 0.04, y: 120 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.58, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* CAPA 1 (ANTI-GIRO): 
          Si la carta se acuesta (-90deg), esta capa gira (+90deg) desde el centro exacto.
          Esto aísla al holograma, creando un "lienzo" que SIEMPRE es vertical. 
      */}
      <motion.div
        className="absolute inset-0 w-full h-full"
        style={{ transformOrigin: "center center", transformStyle: "preserve-3d" }}
        initial={{ rotateZ: 0 }}
        animate={{ rotateZ: isDefense ? 90 : 0 }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
      >
        
        {/* CAPA 2 (INCLINACIÓN 3D): 
            Como el lienzo exterior ya es siempre vertical, podemos aplicar nuestra inclinación
            hacia atrás (-55deg) con total seguridad de que se levantará hacia la cámara.
        */}
        <motion.div
          className="relative w-full h-full"
          style={{ transformOrigin: "bottom center", transformStyle: "preserve-3d" }}
          initial={{ rotateX: -55 }}
          animate={{ rotateX: -55 }} // Siempre -55, ya no le pasamos el rotateZ aquí
          transition={{ duration: 0.4, ease: "easeInOut" }}
        >
          
          {/* Sombra de anclaje */}
          <div 
            className="absolute left-1/2 bottom-[5px] -translate-x-1/2 w-[220px] h-[30px] bg-black/85 blur-xl rounded-full"
            style={{ transform: "translateZ(-10px)" }}
          />

          {/* IMAGEN VIVA Y MASIVA 
              ¡Ya no necesitamos condicionales aquí! Siempre estará a bottom-[95%] 
          */}
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
              className="object-contain drop-shadow-[0_20px_35px_rgba(0,0,0,0.9)]"
              style={{ transform: "translateZ(40px)" }}
              priority 
            />
          </motion.div>

          {/* COLUMNA DE ATRIBUTOS (HUD 2D) */}
          <div 
            className="absolute left-1/2 bottom-[75%] -translate-x-1/2 flex flex-col gap-3 w-full"
            // Solo contrarrestamos el rotateX(55deg) porque el rotateZ ya lo maneja la CAPA 1
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
    </motion.div>
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
