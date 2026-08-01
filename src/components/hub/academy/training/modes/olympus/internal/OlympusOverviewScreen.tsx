// src/components/hub/academy/training/modes/olympus/internal/OlympusOverviewScreen.tsx - Antesala del modo: campeón, leyenda, árbol e intentos.
"use client";
import { useState } from "react";
import { ACADEMY_TRAINING_ARENA_ROUTE } from "@/core/constants/routes/academy-routes";
import { OlympusMode } from "../useOlympusMode";
import { OlympusAttemptGauge } from "./OlympusAttemptGauge";
import { OlympusChampionSelector } from "./OlympusChampionSelector";
import { OlympusConfirmDialog } from "./OlympusConfirmDialog";
import { OlympusLegendSelector } from "./OlympusLegendSelector";
import { OlympusUpgradeTree } from "./OlympusUpgradeTree";

interface IOlympusOverviewScreenProps {
  mode: OlympusMode;
  onEnterBattle: (championId: string, opponentId: string) => void;
}

export function OlympusOverviewScreen({ mode, onEnterBattle }: IOlympusOverviewScreenProps) {
  const overview = mode.overview;
  const unlockedChampions = overview?.champions.filter((state) => state.unlocked) ?? [];
  const [championId, setChampionId] = useState<string | null>(null);
  const [legendId, setLegendId] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  if (!overview) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-[#0a0513] px-6 text-center text-sm font-black uppercase tracking-[0.2em] text-amber-200">
        {mode.error ?? "Abriendo las puertas del Olimpo…"}
      </main>
    );
  }

  // Sin selección explícita se usa el primer campeón desbloqueado y la primera leyenda del catálogo.
  const champion = unlockedChampions.find((state) => state.champion.id === championId) ?? unlockedChampions[0] ?? null;
  const legend = overview.legends.find((candidate) => candidate.id === legendId) ?? overview.legends[0] ?? null;
  const pending = overview.pendingBattle;
  const canFight = Boolean(champion && legend) && (pending !== null || overview.allowance.attemptsRemaining > 0);

  const startBattle = () => {
    if (!champion || !legend) return;
    // Reanudar no gasta intento: el servidor devuelve la batalla ya emitida.
    if (pending) return onEnterBattle(pending.championId, pending.opponentId);
    setIsConfirming(true);
  };

  return (
    <main className="relative min-h-dvh bg-[radial-gradient(circle_at_50%_-10%,rgba(168,85,247,0.22),transparent_55%),radial-gradient(circle_at_50%_110%,rgba(251,191,36,0.12),transparent_50%),#0a0513] px-3 py-4 text-slate-200 md:px-6 md:py-6">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 pb-28 md:pb-6">
        <header className="flex flex-wrap items-end gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.34em] text-violet-400/80">Desafío legendario</p>
            <h1 className="bg-[linear-gradient(100deg,#fde68a,#f0abfc,#c4b5fd)] bg-clip-text text-3xl font-black uppercase italic tracking-tight text-transparent md:text-5xl">
              Olimpo
            </h1>
          </div>
          <a
            href={ACADEMY_TRAINING_ARENA_ROUTE}
            className="ml-auto flex min-h-[44px] items-center rounded-xl border border-violet-700/60 px-4 text-[11px] font-black uppercase tracking-wider text-violet-200 transition hover:bg-violet-900/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300"
          >
            ← Volver a Arena
          </a>
        </header>

        <OlympusAttemptGauge allowance={overview.allowance} />

        {pending ? (
          <p role="status" className="rounded-xl border border-amber-400/50 bg-amber-950/30 px-4 py-3 text-[12px] font-bold text-amber-200">
            Tienes un combate a medias. Retomarlo no gasta otro intento.
          </p>
        ) : null}
        {mode.error ? (
          <p role="alert" className="rounded-xl border border-rose-500/50 bg-rose-950/40 px-4 py-3 text-[12px] font-bold text-rose-200">
            {mode.error}
          </p>
        ) : null}

        {unlockedChampions.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-violet-700/60 bg-[#120a1e]/70 p-6 text-center text-[12px] leading-relaxed text-violet-200/80">
            Todavía no tienes campeones. Derrota a los rivales de Arena clásica en su nivel para que presten
            su mazo en el Olimpo.
          </p>
        ) : (
          <>
            <OlympusChampionSelector
              champions={overview.champions}
              selectedId={champion?.champion.id ?? null}
              onSelect={setChampionId}
            />
            <OlympusLegendSelector
              legends={overview.legends}
              defeatedLegendIds={overview.defeatedLegendIds}
              selectedId={legend?.id ?? null}
              onSelect={setLegendId}
            />
            {champion ? (
              <OlympusUpgradeTree
                champion={champion}
                ascensionFragments={overview.ascensionFragments}
                isBusy={mode.isLoading}
                onPurchase={(nodeId) => void mode.purchaseUpgrade(champion.champion.id, nodeId)}
                onRespec={() => void mode.respecUpgrades(champion.champion.id)}
              />
            ) : null}
          </>
        )}
      </div>

      {/* CTA fija en móvil: el pulgar la alcanza sin recorrer toda la página. */}
      {unlockedChampions.length > 0 ? (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-violet-800/60 bg-[#0a0513]/95 p-3 backdrop-blur md:static md:mx-auto md:max-w-6xl md:border-0 md:bg-transparent md:p-0 md:pb-6">
          <button
            type="button"
            aria-label={pending ? "Retomar el combate pendiente" : "Elegir combate contra la leyenda"}
            disabled={!canFight || mode.isLoading}
            onClick={startBattle}
            className="min-h-[52px] w-full rounded-xl border border-amber-300/70 bg-[linear-gradient(120deg,rgba(251,191,36,0.3),rgba(168,85,247,0.3))] text-base font-black uppercase italic tracking-wider text-amber-50 transition hover:brightness-125 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-200"
          >
            {pending
              ? "Retomar combate"
              : overview.allowance.attemptsRemaining === 0
                ? "Sin intentos hasta el reset"
                : `Desafiar a ${legend?.displayName ?? "la leyenda"}`}
          </button>
        </div>
      ) : null}

      {isConfirming && champion && legend ? (
        <OlympusConfirmDialog
          champion={champion}
          legend={legend}
          attemptsRemaining={overview.allowance.attemptsRemaining}
          isBusy={mode.isLoading}
          onConfirm={() => {
            setIsConfirming(false);
            onEnterBattle(champion.champion.id, legend.id);
          }}
          onCancel={() => setIsConfirming(false)}
        />
      ) : null}
    </main>
  );
}
