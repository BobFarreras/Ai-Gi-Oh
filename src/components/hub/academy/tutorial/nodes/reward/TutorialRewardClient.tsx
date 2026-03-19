// src/components/hub/academy/tutorial/nodes/reward/TutorialRewardClient.tsx - UI cliente para reclamar recompensa final del tutorial con feedback de estado.
"use client";
import Link from "next/link";
import { useState } from "react";
import { postTutorialRewardClaim } from "@/services/tutorial/tutorial-node-progress-client";
import { TutorialNodeState } from "@/core/entities/tutorial/ITutorialMapNode";

interface ITutorialRewardClientProps {
  rewardNodeState: TutorialNodeState;
}

function resolveStatusText(state: TutorialNodeState): string {
  if (state === "COMPLETED") return "Ya reclamaste la recompensa final.";
  if (state === "AVAILABLE") return "Puedes reclamar la recompensa final ahora.";
  return "Completa los nodos previos para desbloquear el claim final.";
}

export function TutorialRewardClient({ rewardNodeState }: ITutorialRewardClientProps) {
  const [status, setStatus] = useState(resolveStatusText(rewardNodeState));
  const [isLoading, setIsLoading] = useState(false);

  async function handleClaim() {
    // El claim es idempotente: si ya fue aplicado mantenemos mensaje claro para evitar duplicados/confusión.
    setIsLoading(true);
    try {
      const result = await postTutorialRewardClaim();
      setStatus(result.applied ? `Recompensa aplicada: +${result.rewardNexus} Nexus.` : "La recompensa ya estaba reclamada.");
    } catch {
      setStatus("No se pudo reclamar la recompensa final.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="mx-auto w-full max-w-3xl rounded-2xl border border-cyan-300/35 bg-slate-950/80 p-5">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">Nodo 4</p>
      <h1 className="mt-2 text-2xl font-black uppercase text-cyan-100">Recompensa Final</h1>
      <p className="mt-2 text-sm text-slate-300">Claim idempotente del cierre de onboarding. Recompensa configurable por entorno.</p>
      <p className="mt-3 text-xs font-black uppercase tracking-[0.14em] text-emerald-300">{status}</p>
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={handleClaim}
          disabled={isLoading || rewardNodeState === "LOCKED"}
          className="rounded-md border border-cyan-300/45 px-3 py-2 text-xs font-black uppercase text-cyan-100 disabled:opacity-45"
        >
          {isLoading ? "Reclamando..." : "Reclamar recompensa"}
        </button>
        <Link href="/hub/tutorial" className="rounded-md border border-slate-600 px-3 py-2 text-xs font-black uppercase text-slate-200">
          Volver al mapa
        </Link>
      </div>
    </section>
  );
}
