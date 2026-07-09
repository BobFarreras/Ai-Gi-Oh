// src/components/game/card/internal/CardHologram.tsx - Renderiza la capa holográfica animada de cartas en tablero.
"use client";

import Image from "next/image";
import { memo } from "react";
import { motion } from "framer-motion";
import { ICard } from "@/core/entities/ICard";
import { cn } from "@/lib/utils";
import { CardHologramStatColumn } from "./CardHologramStatColumn";

interface CardHologramProps {
  card: ICard;
  isDefense: boolean;
  mode?: "full" | "lite";
  className?: string;
}

function CardHologramComponent({ card, isDefense, mode = "full", className }: CardHologramProps) {
  const isExecution = card.type === "EXECUTION";
  const shouldBypassImageOptimization = Boolean(card.renderUrl?.startsWith("/assets/renders/"));

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
        {/* Glow con gradiente radial en la zona superior (acompaña a la imagen): mismo aspecto que
            blur-2xl sin coste de filtro GPU. */}
        <div className="absolute left-1/2 top-[-4%] h-[58%] w-[80%] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(34,211,238,0.28)_0%,rgba(34,211,238,0.12)_55%,transparent_75%)]" />
        {/* Imagen holográfica anclada ARRIBA, como en el desktop: ocupa la mitad superior de la carta. */}
        <div className="absolute inset-x-0 top-[-6%] h-[62%]">
          <Image
            src={card.renderUrl}
            alt={`Render de ${card.name}`}
            fill
            sizes="180px"
            unoptimized={shouldBypassImageOptimization}
            quality={45}
            className="object-contain opacity-90 drop-shadow-[0_0px_12px_rgba(0,0,0,0.7)]"
          />
        </div>
        {/* Atributos ABAJO, como en el desktop: misma columna (colores/iconos/sombras) en tamaño
            `compact` para que quepan bajo la imagen sin taparla. Evita el coste del full: sin blur de
            GPU ni animación en bucle. */}
        <CardHologramStatColumn
          card={card}
          isExecution={isExecution}
          variant="compact"
          className="absolute left-1/2 bottom-[3%] z-50"
          style={{ transform: "translate(-50%, 0) translateZ(20px)", transformStyle: "preserve-3d" }}
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
              sizes="420px"
              unoptimized={shouldBypassImageOptimization}
              className="object-contain drop-shadow-[0_0px_35px_rgba(0,0,0,0.9)]"
              style={{ transform: "translateZ(40px)" }}
            />
          </motion.div>

          {/* COLUMNA DE ATRIBUTOS (HUD 2D) */}
          <CardHologramStatColumn
            card={card}
            isExecution={isExecution}
            className="absolute left-1/2 bottom-[75%] -translate-x-1/2"
            style={{ transform: "translateZ(100px) rotateX(55deg)" }}
          />

        </motion.div>
      </motion.div>
    </div>
  );
}

/** Memoizado: el holograma solo debe re-renderizar si cambian carta, modo o postura. */
export const CardHologram = memo(CardHologramComponent);
