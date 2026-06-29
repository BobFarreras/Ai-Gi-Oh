// src/components/game/card/ResponsiveGameCard.tsx - Envoltorio que escala la Card de tamaño fijo (260×380) para llenar fluidamente el ancho de su celda manteniendo la proporción 13/19.
"use client";

import { useRef } from "react";
import { ICard } from "@/core/entities/ICard";
import { Card } from "./Card";
import { useElementWidth } from "./internal/use-element-width";

/** Dimensiones nativas de la Card rica; la escala se calcula sobre este ancho base. */
const CARD_BASE_WIDTH = 260;
const CARD_BASE_HEIGHT = 380;

interface IResponsiveGameCardProps {
  card: ICard;
  onClick?: (card: ICard) => void;
  /** En contextos de catálogo (tienda/colección) se desactivan efectos costosos por defecto. */
  disableHologram?: boolean;
  disableHoverEffects?: boolean;
}

/**
 * Mide el ancho real del contenedor y aplica `scale = ancho / 260` sobre la Card completa,
 * de modo que la carta rica llena cualquier celda sin recortes ni huecos en cualquier ancho.
 */
export function ResponsiveGameCard({
  card,
  onClick,
  disableHologram = true,
  disableHoverEffects = true,
}: IResponsiveGameCardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const width = useElementWidth(containerRef);
  const scale = width / CARD_BASE_WIDTH;

  return (
    <div ref={containerRef} className="relative aspect-[13/19] w-full overflow-hidden">
      {width > 0 ? (
        <div
          className="absolute left-0 top-0 origin-top-left"
          style={{ width: CARD_BASE_WIDTH, height: CARD_BASE_HEIGHT, transform: `scale(${scale})` }}
        >
          <Card
            card={card}
            onClick={onClick}
            disableHologram={disableHologram}
            disableHoverEffects={disableHoverEffects}
            disableDefaultShadow
          />
        </div>
      ) : null}
    </div>
  );
}
