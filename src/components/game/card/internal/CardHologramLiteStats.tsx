// src/components/game/card/internal/CardHologramLiteStats.tsx - Columna de atributos flotante y económica para el holograma lite (móvil): mismo lenguaje visual del desktop sin blur ni animación infinita.
"use client";

import { memo } from "react";
import { Shield, Sword, Zap } from "lucide-react";
import { ICard } from "@/core/entities/ICard";
import { AnimatedStatNumber } from "./AnimatedStatNumber";

interface CardHologramLiteStatsProps {
  card: ICard;
  /** Las ejecuciones no tienen ATK/DEF: solo coste. */
  isExecution: boolean;
}

/**
 * Atributos "flotantes" para el tablero móvil. Recupera la lectura del desktop (coste/ATK/DEF con
 * inclinación 3D) evitando lo caro del holograma `full`: sin `blur` de GPU, sin imagen gigante y sin
 * animación en bucle. `AnimatedStatNumber` solo consume rAF cuando el valor cambia (buff), así que en
 * reposo el coste es nulo. Las medidas están afinadas para la carta del tablero (260×380).
 */
function CardHologramLiteStatsComponent({ card, isExecution }: CardHologramLiteStatsProps) {
  return (
    <div
      className="pointer-events-none absolute left-1/2 top-[5%] z-50 flex flex-col gap-1"
      style={{ transform: "translateX(-50%) translateZ(28px) rotateX(26deg)", transformStyle: "preserve-3d" }}
    >
      <LiteStatRow
        icon={<Zap className="h-7 w-7 text-yellow-400 fill-yellow-400/30" />}
        value={card.cost}
        colorClass="text-yellow-400"
      />
      {!isExecution && (
        <>
          <LiteStatRow
            icon={<Sword className="h-7 w-7 text-red-500 fill-red-500/30" />}
            value={card.attack ?? 0}
            colorClass="text-red-500"
          />
          <LiteStatRow
            icon={<Shield className="h-7 w-7 text-blue-500 fill-blue-500/30" />}
            value={card.defense ?? 0}
            colorClass="text-blue-500"
          />
        </>
      )}
    </div>
  );
}

/** Memoizada: solo debe repintar si cambian los stats de la carta. */
export const CardHologramLiteStats = memo(CardHologramLiteStatsComponent);

/** Fila icono + número con sombra fuerte para legibilidad sobre el arte de la carta. */
function LiteStatRow({ icon, value, colorClass }: { icon: React.ReactNode; value: number; colorClass: string }) {
  return (
    <div className="flex items-center gap-1.5 drop-shadow-[0_4px_6px_rgba(0,0,0,1)]">
      <span className="flex h-7 w-7 items-center justify-center">{icon}</span>
      <span
        className={`font-black text-4xl tracking-tighter ${colorClass} [text-shadow:_0_3px_12px_#000,_0_0_8px_#000,_0_0_4px_#000]`}
      >
        <AnimatedStatNumber value={value} />
      </span>
    </div>
  );
}
