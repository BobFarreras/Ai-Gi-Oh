// src/components/game/card/internal/CardHologramStatColumn.tsx - Columna flotante de atributos (energía/ATK/DEF) compartida por el holograma desktop (full) y móvil (lite) para un aspecto idéntico.
"use client";

import { memo, type CSSProperties, type ReactNode } from "react";
import { Shield, Sword, Zap } from "lucide-react";
import { ICard } from "@/core/entities/ICard";
import { cn } from "@/lib/utils";
import { AnimatedStatNumber } from "./AnimatedStatNumber";

/**
 * `full`: tamaño grande del desktop (holograma proyectado en 3D sobre el tablero).
 * `compact`: versión reducida para móvil, para que los atributos quepan DEBAJO de la imagen
 * (misma disposición que el desktop: imagen arriba, atributos abajo) sin solaparse con ella.
 */
type StatColumnVariant = "full" | "compact";

interface StatColumnTokens {
  column: string;
  row: string;
  icon: string;
  value: string;
}

const VARIANT_TOKENS: Record<StatColumnVariant, StatColumnTokens> = {
  full: { column: "gap-3", row: "grid-cols-[3rem_1fr] gap-6", icon: "h-12 w-12", value: "text-6xl" },
  compact: { column: "gap-2", row: "grid-cols-[2.5rem_1fr] gap-4", icon: "h-9 w-9", value: "text-5xl" },
};

interface CardHologramStatColumnProps {
  card: ICard;
  /** Las ejecuciones no tienen ATK/DEF: solo coste. */
  isExecution: boolean;
  /** Clases de posicionamiento del contenedor (difieren entre full y lite). */
  className?: string;
  /** Transform 3D de posicionamiento (difiere entre full y lite). */
  style?: CSSProperties;
  /** Tamaño de la columna: `full` (desktop) o `compact` (móvil). */
  variant?: StatColumnVariant;
}

/**
 * Columna de atributos del holograma. El diseño (iconos, sombras, colores) es el mismo en desktop y
 * móvil; solo cambian el tamaño (`variant`) y el posicionamiento (`className`/`style`).
 * `AnimatedStatNumber` solo consume rAF cuando el valor cambia (buff), así que en reposo el coste es nulo.
 */
function CardHologramStatColumnComponent({ card, isExecution, className, style, variant = "full" }: CardHologramStatColumnProps) {
  const tokens = VARIANT_TOKENS[variant];
  return (
    <div className={cn("flex w-full flex-col", tokens.column, className)} style={style}>
      <StatRow
        tokens={tokens}
        icon={<Zap className={cn(tokens.icon, "text-yellow-400 fill-yellow-400/30")} />}
        value={card.cost}
        colorClass="text-yellow-400"
      />
      {!isExecution && (
        <>
          <StatRow
            tokens={tokens}
            icon={<Sword className={cn(tokens.icon, "text-red-500 fill-red-500/30")} />}
            value={card.attack ?? 0}
            colorClass="text-red-500"
          />
          <StatRow
            tokens={tokens}
            icon={<Shield className={cn(tokens.icon, "text-blue-500 fill-blue-500/30")} />}
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
function StatRow({ tokens, icon, value, colorClass }: { tokens: StatColumnTokens; icon: ReactNode; value: number; colorClass: string }) {
  return (
    <div className={cn("grid items-center drop-shadow-[0_8px_12px_rgba(0,0,0,1)]", tokens.row)}>
      <div className="flex justify-center">{icon}</div>
      <span
        className={cn("font-black tracking-tighter text-left", tokens.value, colorClass, "[text-shadow:_0_5px_20px_#000,_0_0_15px_#000,_0_0_5px_#000]")}
      >
        <AnimatedStatNumber value={value} />
      </span>
    </div>
  );
}
