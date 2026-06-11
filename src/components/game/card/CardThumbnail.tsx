// src/components/game/card/CardThumbnail.tsx - Miniatura estática de carta para listas y mosaicos: paridad visual con Card sin animaciones ni capas pesadas.
import Image from "next/image";
import { memo } from "react";
import { ICard } from "@/core/entities/ICard";
import { cn } from "@/lib/utils";
import { CARD_CLIP_PATHS, getCardTypeStyles } from "./internal/styles";

/** Etiquetas cortas en español para cartas sin stats de combate. */
const NON_ENTITY_TYPE_LABELS: Partial<Record<ICard["type"], string>> = {
  TRAP: "TRAMPA",
  EXECUTION: "EJEC",
  ENVIRONMENT: "ENTORNO",
};

interface CardThumbnailProps {
  card: ICard;
  /** Tier de versión: a partir de V5 se muestra badge mastery (sustituye al aura animada). */
  versionTier?: number;
  /** Nivel de progresión; si se aporta se muestra chip "LVL n". */
  level?: number;
  isSelected?: boolean;
  className?: string;
}

/**
 * Representación ligera de carta (~8 nodos DOM, 1 imagen, 0 animaciones).
 * Sustituye a <Card> escalada en mosaicos, listados y logs según el plan de rendimiento.
 * Llena el contenedor padre: dimensionar con width + aspect-[13/19].
 */
function CardThumbnailComponent({ card, versionTier = 0, level, isSelected = false, className }: CardThumbnailProps) {
  const factionStyles = getCardTypeStyles(card);
  const isEntityLike = card.type === "ENTITY" || card.type === "FUSION";
  const isMasteryTier = versionTier >= 5;
  const shouldBypassImageOptimization = Boolean(card.renderUrl?.startsWith("/assets/renders/"));

  return (
    <div
      className={cn(
        "relative h-full w-full select-none p-[1.5px]",
        factionStyles.wrapper,
        isSelected ? "ring-1 ring-yellow-400" : "",
        className,
      )}
      style={{ clipPath: CARD_CLIP_PATHS.outer }}
      data-card-thumbnail-id={card.id}
    >
      <div
        className={cn("relative flex h-full w-full flex-col overflow-hidden bg-gradient-to-br", factionStyles.inner)}
        style={{ clipPath: CARD_CLIP_PATHS.inner }}
      >
        {/* Zona de arte: ocupa el cuerpo superior de la miniatura. */}
        <div className="relative w-full flex-1 overflow-hidden bg-black/60">
          {card.renderUrl ? (
            <Image
              src={card.renderUrl}
              alt={`Miniatura de ${card.name}`}
              fill
              sizes="96px"
              quality={40}
              unoptimized={shouldBypassImageOptimization}
              className="object-contain p-px"
            />
          ) : null}
          {/* Chip de coste: legible incluso a 50px de ancho. */}
          <span className="absolute left-px top-px z-10 rounded-br bg-black/80 px-1 text-[8px] font-black leading-tight text-yellow-300">
            {card.cost}
          </span>
          {isMasteryTier ? (
            <span className="absolute right-px top-px z-10 rounded-bl bg-amber-500/90 px-1 text-[7px] font-black leading-tight text-amber-950">
              V{versionTier}
            </span>
          ) : null}
        </div>
        {/* Banda inferior: nombre y stats estáticos. */}
        <div className="z-10 flex w-full flex-col bg-black/70 px-1 pb-0.5">
          <span className="truncate text-center text-[7px] font-black uppercase leading-tight text-white">{card.name}</span>
          <span className="flex items-center justify-center gap-1 text-[7px] font-black leading-tight">
            {isEntityLike ? (
              <>
                <span className="text-red-400">{card.attack ?? 0}</span>
                <span className="text-zinc-500">/</span>
                <span className="text-blue-400">{card.defense ?? 0}</span>
              </>
            ) : (
              <span className="tracking-widest text-cyan-300">{NON_ENTITY_TYPE_LABELS[card.type] ?? card.type}</span>
            )}
            {typeof level === "number" ? <span className="ml-0.5 text-cyan-300">L{level}</span> : null}
          </span>
        </div>
      </div>
    </div>
  );
}

/** Memoizada: las miniaturas en grids largos no deben re-renderizar al repintar el contenedor. */
export const CardThumbnail = memo(CardThumbnailComponent);
