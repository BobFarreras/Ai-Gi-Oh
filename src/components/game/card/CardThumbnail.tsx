// src/components/game/card/CardThumbnail.tsx - Miniatura de carta con la anatomía visual del Card (cabecera, arte, nombre, nivel, stats); opcionalmente muestra un skeleton mientras carga el arte.
"use client";

import Image from "next/image";
import { memo, useState } from "react";
import { ICard } from "@/core/entities/ICard";
import { getCardLevelProgressMetrics } from "@/core/services/progression/card-level-rules";
import { cn } from "@/lib/utils";
import { resolveTypeBadge } from "./internal/card-frame-meta";
import { CardUpgradeBadges } from "./internal/CardUpgradeBadges";
import { CardThumbnailFooter } from "./internal/CardThumbnailFooter";
import { CARD_THUMBNAIL_CLIP_PATHS, getCardTypeStyles } from "./internal/styles";
import { CardArtVignette } from "./internal/CardArtVignette";
import { getCardImageClassName, shouldRenderCardBackground, shouldRenderSpellTrapVignette } from "./internal/spell-trap-image-utils";

interface CardThumbnailProps {
  card: ICard;
  /** Tier de versión: se muestra como "V n" en cabecera; V5+ añade realce mastery estático. */
  versionTier?: number;
  /** Nivel de progresión; junto a xp pinta la barra de nivel como en Card. */
  level?: number;
  /** XP actual para el ancho de la barra de progreso de nivel. */
  xp?: number;
  isSelected?: boolean;
  className?: string;
  /** Usa object-cover para el render en lugar de object-contain. Útil en contexts compactos como el combat log. */
  coverRender?: boolean;
  /**
   * Muestra un skeleton (pulse) en la zona de arte mientras la imagen de render carga. Pensado para
   * grids largos con imágenes lazy (p.ej. mercado): al hacer scroll rápido ya no se ve el arte en
   * negro, sino un "contenedor cargando". Se desactiva por defecto para no afectar a otros usos.
   */
  showArtSkeleton?: boolean;
}

/**
 * Representación ligera de carta (~15 nodos DOM, 0 animaciones) que replica la
 * anatomía del Card real: cabecera (coste + versión + tipo), arte con fondo,
 * nombre, barra de nivel y footer de stats. Llena por completo su contenedor;
 * el contenedor debe imponer la proporción de carta (aspect-[13/19]).
 */
function CardThumbnailComponent({ card, versionTier = 0, level, xp = 0, isSelected = false, className, coverRender = false, showArtSkeleton = false }: CardThumbnailProps) {
  const factionStyles = getCardTypeStyles(card);
  const isMasteryTier = versionTier >= 5;
  const shouldBypassImageOptimization = Boolean(card.renderUrl?.startsWith("/assets/renders/"));
  const levelMetrics = typeof level === "number" ? getCardLevelProgressMetrics(level, xp) : null;
  const upgradeCounts = card.upgradeCounts ?? null;
  const [isArtLoaded, setIsArtLoaded] = useState(false);
  const shouldRenderArtSkeleton = showArtSkeleton && Boolean(card.renderUrl) && !isArtLoaded;
  const hasSpellTrapVignette = shouldRenderSpellTrapVignette(card, { coverRender });
  const renderImageClassName = getCardImageClassName(card, { coverRender });

  return (
    <div
      className={cn(
        // Llena su caja: el contenedor fija la proporción de carta y la imagen interior se adapta.
        "relative h-full w-full select-none p-px",
        factionStyles.wrapper,
        isSelected ? "ring-1 ring-yellow-400" : "",
        isMasteryTier && !isSelected ? "ring-1 ring-amber-400/80" : "",
        className,
      )}
      style={{ clipPath: CARD_THUMBNAIL_CLIP_PATHS.outer }}
      data-card-thumbnail-id={card.id}
    >
      <div
        className={cn("relative flex h-full w-full min-w-0 flex-col overflow-hidden bg-gradient-to-br", factionStyles.inner)}
        style={{ clipPath: CARD_THUMBNAIL_CLIP_PATHS.inner }}
      >
        {/* Cabecera: coste (sello amarillo), versión y tipo, como CardFrameHeader. */}
        <div className="z-10 flex w-full min-w-0 items-center justify-between gap-0.5 px-0.5 pt-0.5">
          <span className="flex items-center gap-0.5">
            <span
              className="flex h-3.5 w-3.5 shrink-0 items-center justify-center border border-yellow-500/80 bg-black text-[8px] font-black leading-none text-yellow-400"
              style={{ clipPath: "polygon(2px 0, 100% 0, 100% calc(100% - 2px), calc(100% - 2px) 100%, 0 100%, 0 2px)" }}
            >
              {card.cost}
            </span>
            {versionTier > 0 ? (
              <span className={cn("text-[7px] font-black italic leading-none", isMasteryTier ? "text-amber-400" : "text-white")}>
                V{versionTier}
              </span>
            ) : null}
          </span>
          <span className="truncate rounded border border-white/10 bg-black/90 px-0.5 text-[6px] font-black uppercase tracking-wider text-white/80">
            {resolveTypeBadge(card)}
          </span>
        </div>
        {/* Zona de arte: fondo de carta + render, como CardFrameArtAndProgress. */}
        <div className="relative mx-0.5 mt-0.5 flex-1 overflow-hidden rounded-sm bg-black">
          {shouldRenderArtSkeleton ? (
            <span
              aria-hidden="true"
              className="absolute inset-0 z-0 animate-pulse bg-[linear-gradient(110deg,rgba(30,41,59,0.65),rgba(51,65,85,0.85),rgba(30,41,59,0.65))]"
            />
          ) : null}
          {card.bgUrl && shouldRenderCardBackground(card) ? (
            <Image
              src={card.bgUrl}
              alt=""
              fill
              sizes="96px"
              quality={28}
              className="object-cover opacity-70"
            />
          ) : null}
          {card.renderUrl ? (
            <Image
              src={card.renderUrl}
              alt={`Miniatura de ${card.name}`}
              fill
              sizes="96px"
              quality={40}
              unoptimized={shouldBypassImageOptimization}
              onLoad={() => setIsArtLoaded(true)}
              onError={() => setIsArtLoaded(true)}
              className={renderImageClassName}
            />
          ) : null}
          {hasSpellTrapVignette ? <CardArtVignette /> : null}
          {/* Solo iconos (sin ×N): en miniaturas el número tapaba el arte. Mismo sello que la carta grande. */}
          <CardUpgradeBadges counts={upgradeCounts} variant="compact" />
        </div>
        {/* Nombre y barra de nivel. min-w-0 + block evita que el nombre empuje el ancho de la carta. */}
        <span className="z-10 block w-full min-w-0 truncate px-0.5 pt-0.5 text-center text-[7px] font-black uppercase leading-tight text-white">
          {card.name}
        </span>
        {levelMetrics ? (
          <span className="z-10 flex items-center gap-0.5 px-1 pb-0.5">
            <span className="shrink-0 text-[6px] font-black italic leading-none text-cyan-300">L{level}</span>
            <span className="relative h-0.5 flex-1 overflow-hidden rounded-full border border-cyan-900/50 bg-black">
              <span
                className="absolute left-0 top-0 h-full bg-cyan-400"
                style={{ width: `${Math.round(levelMetrics.progressRatio * 100)}%` }}
              />
            </span>
          </span>
        ) : null}
        <CardThumbnailFooter card={card} />
      </div>
    </div>
  );
}

/** Memoizada: las miniaturas en grids largos no deben re-renderizar al repintar el contenedor. */
export const CardThumbnail = memo(CardThumbnailComponent);
