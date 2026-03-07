// src/components/hub/home/HomeDeckActionBar.tsx - Barra maestra de Arsenal con identidad, acciones y filtros responsive.
"use client";

import { BackButton } from "@/components/ui/BackButton";
import { HomeDeckActionButtons } from "@/components/hub/home/HomeDeckActionButtons";
import { HomeDeckFilterControls } from "@/components/hub/home/HomeDeckFilterControls";
import { IHomeDeckActionBarProps } from "@/components/hub/home/home-deck-action-bar-types";

export function HomeDeckActionBar({
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
}: IHomeDeckActionBarProps) {
  return (
    <header className="relative z-10 flex w-full flex-col gap-3 overflow-hidden rounded-xl border border-cyan-800/50 bg-[#041120]/90 p-3 shadow-[0_0_20px_rgba(8,145,178,0.15),inset_0_0_20px_rgba(0,0,0,0.6)] backdrop-blur-xl sm:px-5 sm:py-3">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgba(34,211,238,0.05),transparent_45%,rgba(59,130,246,0.05))]" />
      <div className="relative flex items-center gap-3 border-cyan-900/60 pr-2 xl:border-r xl:pr-6">
        <BackButton href="/hub" label="Menú" className="mr-1 xs:flex" />
        <h1 className="whitespace-nowrap text-xl font-black uppercase tracking-widest text-cyan-100 drop-shadow-[0_0_10px_rgba(34,211,238,0.6)] sm:text-2xl">
          Mi Home
        </h1>
        <span className="hidden select-none text-cyan-500/50 sm:inline">|</span>
        <p className="hidden whitespace-nowrap text-[10px] font-black uppercase tracking-[0.3em] text-cyan-300/60 md:block">
          Deck Hub
        </p>
      </div>
      <div className="relative flex flex-1 flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <HomeDeckActionButtons
          canInsert={canInsert}
          canRemove={canRemove}
          canEvolve={canEvolve}
          evolveCost={evolveCost}
          onInsert={onInsert}
          onRemove={onRemove}
          onEvolve={onEvolve}
        />
        <HomeDeckFilterControls
          nameQuery={nameQuery}
          typeFilter={typeFilter}
          orderField={orderField}
          orderDirection={orderDirection}
          onNameQueryChange={onNameQueryChange}
          onChangeTypeFilter={onChangeTypeFilter}
          onChangeOrderField={onChangeOrderField}
          onToggleOrderDirection={onToggleOrderDirection}
        />
      </div>
    </header>
  );
}
