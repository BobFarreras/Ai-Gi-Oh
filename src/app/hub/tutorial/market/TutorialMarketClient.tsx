// src/app/hub/tutorial/market/TutorialMarketClient.tsx - Simulación guiada del Market con foco en filtros, compra e historial.
"use client";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { TutorialBigLogDialog } from "@/components/tutorial/flow/TutorialBigLogDialog";
import { TutorialInteractionGuard } from "@/components/tutorial/flow/TutorialInteractionGuard";
import { TutorialSpotlightOverlay } from "@/components/tutorial/flow/TutorialSpotlightOverlay";
import { useTutorialFlowController } from "@/components/tutorial/flow/useTutorialFlowController";
import { postTutorialNodeCompletion } from "@/app/hub/tutorial/internal/tutorial-node-progress-client";
import { MARKET_ORDER_OPTIONS, MARKET_TYPE_OPTIONS } from "@/components/hub/market/layout/market-filter-options";
import { resolveMarketTutorialSteps } from "@/services/tutorial/market/resolve-market-tutorial-steps";

function isAllowedTarget(activeTargetIds: string[], targetId: string): boolean {
  return activeTargetIds.includes(targetId);
}

export function TutorialMarketClient() {
  const steps = useMemo(() => resolveMarketTutorialSteps(), []);
  const tutorial = useTutorialFlowController(steps);
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [orderFilter, setOrderFilter] = useState("PRICE");
  const [wallet, setWallet] = useState(700);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyEntries, setHistoryEntries] = useState<string[]>([]);
  const hasSyncedCompletionRef = useRef(false);

  useEffect(() => {
    if (!tutorial.isFinished || hasSyncedCompletionRef.current) return;
    hasSyncedCompletionRef.current = true;
    postTutorialNodeCompletion("tutorial-market-basics").catch(() => {
      hasSyncedCompletionRef.current = false;
    });
  }, [tutorial.isFinished]);

  return (
    <section className="relative mx-auto w-full max-w-5xl rounded-2xl border border-cyan-300/30 bg-slate-950/90 p-5 pb-40">
      <TutorialInteractionGuard isEnabled={!tutorial.isFinished} allowedTargetIds={tutorial.allowedTargetIds} />
      <TutorialSpotlightOverlay isVisible={!tutorial.isFinished} targetId={tutorial.currentStep?.targetId ?? null} />
      <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">Nodo 3 - Market</p>
      <h1 className="mt-1 text-2xl font-black uppercase text-cyan-100">Simulación de Market</h1>
      <p className="mt-2 text-sm text-slate-300">Práctica guiada para dominar búsqueda, orden y compra antes de usar el market real.</p>
      <p className="mt-4 text-sm font-black uppercase text-emerald-300">Nexus: {wallet}</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="text-xs font-black uppercase text-cyan-200">
          Tipo
          <select
            data-tutorial-id="market-type-filter"
            value={typeFilter}
            onChange={(event) => {
              setTypeFilter(event.target.value);
              tutorial.onAction("CHANGE_TYPE_FILTER");
            }}
            disabled={!isAllowedTarget(tutorial.allowedTargetIds, "market-type-filter") && !tutorial.isFinished}
            className="mt-2 block w-full rounded-md border border-cyan-300/35 bg-slate-900 px-2 py-2 text-xs text-slate-100 disabled:opacity-45"
          >
            {MARKET_TYPE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
        <label className="text-xs font-black uppercase text-cyan-200">
          Orden
          <select
            data-tutorial-id="market-order-filter"
            value={orderFilter}
            onChange={(event) => {
              setOrderFilter(event.target.value);
              tutorial.onAction("CHANGE_ORDER_FILTER");
            }}
            disabled={!isAllowedTarget(tutorial.allowedTargetIds, "market-order-filter") && !tutorial.isFinished}
            className="mt-2 block w-full rounded-md border border-cyan-300/35 bg-slate-900 px-2 py-2 text-xs text-slate-100 disabled:opacity-45"
          >
            {MARKET_ORDER_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
      </div>
      <button
        type="button"
        data-tutorial-id="market-buy-pack"
        onClick={() => {
          setWallet((current) => current - 200);
          setHistoryEntries((current) => [`Compra de sobre: -200 NX (${new Date().toISOString()})`, ...current].slice(0, 4));
          tutorial.onAction("BUY_PACK");
        }}
        disabled={wallet < 200 || (!isAllowedTarget(tutorial.allowedTargetIds, "market-buy-pack") && !tutorial.isFinished)}
        className="mt-4 rounded-md border border-cyan-300/45 px-3 py-2 text-xs font-black uppercase text-cyan-100 disabled:opacity-45"
      >
        Comprar sobre (200 NX)
      </button>
      <button
        type="button"
        data-tutorial-id="market-history-tab"
        onClick={() => {
          setIsHistoryOpen(true);
          tutorial.onAction("OPEN_HISTORY");
        }}
        disabled={!isAllowedTarget(tutorial.allowedTargetIds, "market-history-tab") && !tutorial.isFinished}
        className="ml-2 mt-4 rounded-md border border-fuchsia-300/45 px-3 py-2 text-xs font-black uppercase text-fuchsia-100 disabled:opacity-45"
      >
        Abrir historial
      </button>
      {isHistoryOpen ? (
        <div className="mt-4 rounded-xl border border-cyan-800/70 bg-slate-900/75 p-3">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-cyan-200">Historial reciente</p>
          <ul className="mt-2 space-y-1 text-xs text-slate-200">
            {historyEntries.length > 0 ? historyEntries.map((entry) => <li key={entry}>{entry}</li>) : <li>Sin transacciones.</li>}
          </ul>
        </div>
      ) : null}
      <div className="mt-6 flex gap-2">
        <Link href="/hub/tutorial" className="rounded-md border border-slate-600 px-3 py-2 text-xs font-black uppercase text-slate-200">Volver al mapa</Link>
        <Link href="/hub/market" className="rounded-md border border-cyan-300/45 px-3 py-2 text-xs font-black uppercase text-cyan-100">Abrir Market real</Link>
      </div>
      <TutorialBigLogDialog
        title={tutorial.currentStep?.title ?? "Práctica completada"}
        description={tutorial.currentStep?.description ?? "Has completado el flujo base de Market. En la siguiente fase conectaremos este motor con interacciones de producción."}
        canUseNext={tutorial.canUseNext}
        isFinished={tutorial.isFinished}
        onNext={tutorial.onNext}
      />
    </section>
  );
}
