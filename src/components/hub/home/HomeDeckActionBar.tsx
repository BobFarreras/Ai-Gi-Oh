// src/components/hub/home/HomeDeckActionBar.tsx - Barra maestra de Arsenal con identidad y filtros; acciones en desktop.
"use client";

import { Search } from "lucide-react";
import { BackButton } from "@/components/ui/BackButton";
import { HomeDeckActionButtons } from "@/components/hub/home/HomeDeckActionButtons";
import { HomeDeckFilterControls } from "@/components/hub/home/HomeDeckFilterControls";
import { useViewportWidth } from "@/components/hub/internal/use-viewport-width";
import { isDesktopLayoutViewport } from "@/components/internal/layout-breakpoints";
import { IHomeDeckActionBarProps } from "@/components/hub/home/home-deck-action-bar-types";

const COMPACT_DESKTOP_MAX_WIDTH_PX = 1200;

export function HomeDeckActionBar({
  deckCount,
  deckSize,
  canInsert,
  canRemove,
  typeFilter,
  orderField,
  orderDirection,
  nameQuery,
  onNameQueryChange,
  onChangeTypeFilter,
  onChangeOrderField,
  onToggleOrderDirection,
  onInsert,
  onRemove,
  canEvolve,
  evolveCost,
  onEvolve,
  onBackToHub,
}: IHomeDeckActionBarProps) {
  const viewportWidth = useViewportWidth();
  const isDesktopLayout = isDesktopLayoutViewport(viewportWidth);
  const isCompactDesktopLayout = isDesktopLayout && viewportWidth <= COMPACT_DESKTOP_MAX_WIDTH_PX;

  return (
    <header className="relative z-20 flex w-full flex-col gap-3 overflow-visible rounded-xl border border-cyan-800/50 bg-[#041120]/90 p-3 shadow-[0_0_20px_rgba(8,145,178,0.15),inset_0_0_20px_rgba(0,0,0,0.6)] backdrop-blur-xl sm:px-5 sm:py-3">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgba(34,211,238,0.05),transparent_45%,rgba(59,130,246,0.05))]" />
      <div className="relative flex items-center justify-between gap-3 border-cyan-900/60 pr-2 min-[900px]:border-r min-[900px]:pr-6">
        <div className="flex min-w-0 items-center gap-3">
          <BackButton href="/hub" onClick={onBackToHub} label="Menú" className="mr-1 xs:flex" />
          <h1 className="whitespace-nowrap text-xl font-black uppercase tracking-widest text-cyan-100 drop-shadow-[0_0_10px_rgba(34,211,238,0.6)] sm:text-2xl">
            Arsenal
          </h1>
          <span className="rounded border border-cyan-500/45 bg-cyan-900/25 px-2 py-0.5 text-[11px] font-black tracking-[0.12em] text-cyan-100 md:hidden">
            {deckCount}/{deckSize}
          </span>
          <span className="hidden select-none text-cyan-500/50 sm:inline">|</span>
          <p className="hidden whitespace-nowrap text-[10px] font-black uppercase tracking-[0.3em] text-cyan-300/60 md:block">
            Deck Hub
          </p>
        </div>
        {isCompactDesktopLayout ? (
          <div className="hidden w-full max-w-[36rem] min-[900px]:block">
            <HomeDeckFilterControls
              nameQuery={nameQuery}
              typeFilter={typeFilter}
              orderField={orderField}
              orderDirection={orderDirection}
              showDesktopSearch={false}
              onNameQueryChange={onNameQueryChange}
              onChangeTypeFilter={onChangeTypeFilter}
              onChangeOrderField={onChangeOrderField}
              onToggleOrderDirection={onToggleOrderDirection}
            />
          </div>
        ) : null}
      </div>
      <div className="relative flex flex-1 flex-col gap-3 min-[900px]:items-end">
        {isDesktopLayout && !isCompactDesktopLayout ? (
          <div className="hidden w-full min-[900px]:grid min-[900px]:grid-cols-[1fr_minmax(340px,36rem)] min-[900px]:items-end min-[900px]:gap-2">
            <div className="min-w-0 flex items-end gap-2">
              <HomeDeckActionButtons
                canInsert={canInsert}
                canRemove={canRemove}
                canEvolve={canEvolve}
                evolveCost={evolveCost}
                onInsert={onInsert}
                onRemove={onRemove}
                onEvolve={onEvolve}
              />
              <label className="flex h-[42px] min-w-0 flex-1 items-center gap-2 rounded-lg border border-cyan-500/30 bg-[#020a14]/80 px-3">
                <Search size={14} className="shrink-0 text-cyan-400" />
                <input
                  aria-label="Buscar carta en almacén"
                  value={nameQuery}
                  onChange={(event) => onNameQueryChange(event.target.value)}
                  className="w-full truncate bg-transparent text-xs font-medium tracking-wider text-cyan-50 outline-none placeholder:text-cyan-100/40"
                  placeholder="BUSCAR CARTA..."
                />
              </label>
            </div>
            <div className="w-full">
              <HomeDeckFilterControls
                nameQuery={nameQuery}
                typeFilter={typeFilter}
                orderField={orderField}
                orderDirection={orderDirection}
                showDesktopSearch={false}
                onNameQueryChange={onNameQueryChange}
                onChangeTypeFilter={onChangeTypeFilter}
                onChangeOrderField={onChangeOrderField}
                onToggleOrderDirection={onToggleOrderDirection}
              />
            </div>
          </div>
        ) : (
          <div className="hidden min-[900px]:flex min-[900px]:min-w-0 min-[900px]:items-end min-[900px]:gap-2">
            <HomeDeckActionButtons
              canInsert={canInsert}
              canRemove={canRemove}
              canEvolve={canEvolve}
              evolveCost={evolveCost}
              onInsert={onInsert}
              onRemove={onRemove}
              onEvolve={onEvolve}
            />
            <label className="flex h-[42px] min-w-0 flex-1 items-center gap-2 rounded-lg border border-cyan-500/30 bg-[#020a14]/80 px-3">
              <Search size={14} className="shrink-0 text-cyan-400" />
              <input
                aria-label="Buscar carta en almacén"
                value={nameQuery}
                onChange={(event) => onNameQueryChange(event.target.value)}
                className="w-full truncate bg-transparent text-xs font-medium tracking-wider text-cyan-50 outline-none placeholder:text-cyan-100/40"
                placeholder="BUSCAR CARTA..."
              />
            </label>
          </div>
        )}
        <div className="w-full min-[900px]:hidden">
          <HomeDeckFilterControls
            nameQuery={nameQuery}
            typeFilter={typeFilter}
            orderField={orderField}
            orderDirection={orderDirection}
            showDesktopSearch={false}
            onNameQueryChange={onNameQueryChange}
            onChangeTypeFilter={onChangeTypeFilter}
            onChangeOrderField={onChangeOrderField}
            onToggleOrderDirection={onToggleOrderDirection}
          />
        </div>
      </div>
    </header>
  );
}
