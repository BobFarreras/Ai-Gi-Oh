// src/app/hub/tutorial/arsenal/TutorialArsenalClient.tsx - Simulación guiada de Arsenal usando el motor reusable de tutorial.
"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { TutorialBigLogDialog } from "@/components/tutorial/flow/TutorialBigLogDialog";
import { TutorialInteractionGuard } from "@/components/tutorial/flow/TutorialInteractionGuard";
import { TutorialSpotlightOverlay } from "@/components/tutorial/flow/TutorialSpotlightOverlay";
import { useTutorialFlowController } from "@/components/tutorial/flow/useTutorialFlowController";
import { resolveArsenalTutorialSteps } from "@/services/tutorial/arsenal/resolve-arsenal-tutorial-steps";

function isAllowedTarget(activeTargetIds: string[], targetId: string): boolean {
  return activeTargetIds.includes(targetId);
}

export function TutorialArsenalClient() {
  const steps = useMemo(() => resolveArsenalTutorialSteps(), []);
  const tutorial = useTutorialFlowController(steps);
  const [statusMessage, setStatusMessage] = useState("Sigue las instrucciones de BigLog.");

  return (
    <section className="relative mx-auto w-full max-w-5xl rounded-2xl border border-cyan-300/30 bg-slate-950/90 p-5 pb-40">
      <TutorialInteractionGuard isEnabled={!tutorial.isFinished} allowedTargetIds={tutorial.allowedTargetIds} />
      <TutorialSpotlightOverlay isVisible={!tutorial.isFinished} targetId={tutorial.currentStep?.targetId ?? null} />
      <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">Nodo 1 - Preparar Deck</p>
      <h1 className="mt-1 text-2xl font-black uppercase text-cyan-100">Simulación de Arsenal</h1>
      <p className="mt-2 text-sm text-slate-300">Esta fase valida foco visual + bloqueo de interacción para el nuevo motor tutorial.</p>
      <article data-tutorial-id="arsenal-card-slot" className="mt-5 rounded-xl border border-cyan-900/70 bg-cyan-500/10 p-4">
        <p className="text-sm font-black uppercase text-cyan-100">Carta de práctica</p>
        <p className="mt-1 text-xs text-slate-300">Kernel Sentinel V1</p>
        <button
          type="button"
          onClick={() => {
            tutorial.onAction("SELECT_CARD_DETAIL");
            setStatusMessage("Detalle de carta abierto.");
          }}
          disabled={!isAllowedTarget(tutorial.allowedTargetIds, "arsenal-card-slot") && !tutorial.isFinished}
          className="mt-3 rounded-md border border-cyan-300/45 px-3 py-2 text-xs font-black uppercase text-cyan-100 disabled:opacity-45"
        >
          Abrir detalle
        </button>
      </article>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          data-tutorial-id="arsenal-add-button"
          onClick={() => {
            tutorial.onAction("ADD_CARD_TO_DECK");
            setStatusMessage("Carta añadida al deck.");
          }}
          disabled={!isAllowedTarget(tutorial.allowedTargetIds, "arsenal-add-button") && !tutorial.isFinished}
          className="rounded-md border border-cyan-300/45 px-3 py-3 text-xs font-black uppercase text-cyan-100 disabled:opacity-45"
        >
          Añadir al Deck
        </button>
        <button
          type="button"
          data-tutorial-id="arsenal-evolve-button"
          onClick={() => {
            tutorial.onAction("OPEN_EVOLVE_PANEL");
            setStatusMessage("Panel de evolución abierto.");
          }}
          disabled={!isAllowedTarget(tutorial.allowedTargetIds, "arsenal-evolve-button") && !tutorial.isFinished}
          className="rounded-md border border-fuchsia-300/45 px-3 py-3 text-xs font-black uppercase text-fuchsia-100 disabled:opacity-45"
        >
          Evolucionar
        </button>
      </div>
      <p className="mt-4 text-xs font-bold uppercase tracking-[0.12em] text-emerald-300">{statusMessage}</p>
      <div className="mt-6 flex gap-2">
        <Link href="/hub/tutorial" className="rounded-md border border-slate-600 px-3 py-2 text-xs font-black uppercase text-slate-200">Volver al mapa</Link>
        <Link href="/hub/home" className="rounded-md border border-cyan-300/45 px-3 py-2 text-xs font-black uppercase text-cyan-100">Abrir Arsenal real</Link>
      </div>
      <TutorialBigLogDialog
        title={tutorial.currentStep?.title ?? "Práctica completada"}
        description={tutorial.currentStep?.description ?? "Has completado la práctica base. En la siguiente fase conectaremos esta guía al Arsenal real."}
        canUseNext={tutorial.canUseNext}
        isFinished={tutorial.isFinished}
        onNext={tutorial.onNext}
      />
    </section>
  );
}
