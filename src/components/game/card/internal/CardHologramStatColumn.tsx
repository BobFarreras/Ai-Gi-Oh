// src/components/game/card/internal/CardHologramStatColumn.tsx - Columna flotante de atributos (energía/ATK/DEF) compartida por el holograma desktop (full) y móvil (lite) para un aspecto idéntico.
"use client";

import { memo, type CSSProperties, type ReactNode } from "react";
import { Shield, Sword, Zap } from "lucide-react";
import { ICard } from "@/core/entities/ICard";
import { cn } from "@/lib/utils";
import { AnimatedStatNumber } from "./AnimatedStatNumber";

interface CardHologramStatColumnProps {
  card: ICard;
  /** Las ejecuciones no tienen ATK/DEF: solo coste. */
  isExecution: boolean;
  /** Clases de posicionamiento del contenedor (difieren entre full y lite). */
  className?: string;
  /** Transform 3D de posicionamiento (difiere entre full y lite). */
  style?: CSSProperties;
}

/**
 * Columna de atributos del holograma. El diseño (tamaños, iconos, sombras) es el mismo en desktop y
 * móvil; solo cambia el posicionamiento vía `className`/`style`. `AnimatedStatNumber` solo consume
 * rAF cuando el valor cambia (buff), así que en reposo el coste es nulo.
 */
function CardHologramStatColumnComponent({ card, isExecution, className, style }: CardHologramStatColumnProps) {
  return (
    <div className={cn("flex w-full flex-col gap-3", className)} style={style}>
      <StatRow
        icon={<Zap className="h-12 w-12 text-yellow-400 fill-yellow-400/30" />}
        value={card.cost}
        colorClass="text-yellow-400"
      />
      {!isExecution && (
        <>
          <StatRow
            icon={<Sword className="h-12 w-12 text-red-500 fill-red-500/30" />}
            value={card.attack ?? 0}
            colorClass="text-red-500"
          />
          <StatRow
            icon={<Shield className="h-12 w-12 text-blue-500 fill-blue-500/30" />}
            value={card.defense ?? 0}
            colorClass="text-blue-500"
          />
        </>
      )}
    </div>
  );
}

/** Memoizada: solo repinta si cambian los stats de la carta. */
export const CardHologramStatColumn = memo(CardHologramStatColumnComponent);

/** Grid de dos columnas que alinea los iconos en una línea vertical perfecta. */
function StatRow({ icon, value, colorClass }: { icon: ReactNode; value: number; colorClass: string }) {
  return (
    <div className="grid grid-cols-[3rem_1fr] items-center gap-6 drop-shadow-[0_8px_12px_rgba(0,0,0,1)]">
      <div className="flex justify-center">{icon}</div>
      <span
        className={`font-black text-6xl tracking-tighter text-left ${colorClass} [text-shadow:_0_5px_20px_#000,_0_0_15px_#000,_0_0_5px_#000]`}
      >
        <AnimatedStatNumber value={value} />
      </span>
    </div>
  );
}
