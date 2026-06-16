// src/components/hub/academy/tutorial/nodes/reward/TutorialRewardClient.tsx - UI cliente para reclamar recompensa final del tutorial con feedback de estado.
"use client";
import Link from "next/link";
import { useState } from "react";
import { ACADEMY_TUTORIAL_MAP_ROUTE } from "@/core/constants/routes/academy-routes";
import { postTutorialRewardClaim } from "@/services/tutorial/tutorial-node-progress-client";
import { TutorialNodeState } from "@/core/entities/tutorial/ITutorialMapNode";
import { markTutorialSoundtrackFirstRunFinished } from "@/components/hub/academy/tutorial/internal/tutorial-soundtrack-session";

interface ITutorialRewardClientProps {
  rewardNodeState: TutorialNodeState;
}

const REWARD_SUMMARY = [
  { label: "Nexus", value: "600", tone: "text-emerald-300" },
  { label: "Carta", value: "Mágica de fusión GemGPT", tone: "text-fuchsia-300" },
];

function resolveStateHeader(state: TutorialNodeState): { title: string; subtitle: string; tone: string } {
  if (state === "COMPLETED") {
    return {
      title: "Recompensa reclamada",
      subtitle: "Has completado el tutorial y recibido todos los premios.",
      tone: "emerald",
    };
  }
  if (state === "AVAILABLE") {
    return {
      title: "Recompensa disponible",
      subtitle: "Completa el claim para añadir los recursos a tu cuenta.",
      tone: "cyan",
    };
  }
  return {
    title: "Recompensa bloqueada",
    subtitle: "Completa los nodos Market, Arsenal y Combate para desbloquearla.",
    tone: "slate",
  };
}

export function TutorialRewardClient({ rewardNodeState }: ITutorialRewardClientProps) {
  const [status, setStatus] = useState<string | null>(null);
  const [displayState, setDisplayState] = useState<TutorialNodeState>(rewardNodeState);
  const [isLoading, setIsLoading] = useState(false);
  const header = resolveStateHeader(displayState);
  const isLocked = displayState === "LOCKED";
  const isCompleted = displayState === "COMPLETED";

  async function handleClaim() {
    if (isLocked || isCompleted) return;
    setIsLoading(true);
    try {
      const result = await postTutorialRewardClaim();
      if (result.applied) markTutorialSoundtrackFirstRunFinished();
      setDisplayState("COMPLETED");
      setStatus(result.applied ? `Recompensa aplicada: +${result.rewardNexus} Nexus.` : "La recompensa ya estaba reclamada.");
    } catch {
      setStatus("No se pudo reclamar la recompensa final.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="mx-auto w-full max-w-3xl rounded-2xl border border-cyan-300/35 bg-[#030d16]/92 p-5 shadow-[0_0_40px_rgba(34,211,238,0.18)] backdrop-blur-md sm:p-8">
      <header>
        <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">Nodo 4</p>
        <h1 className="mt-2 text-2xl font-black uppercase text-white sm:text-3xl">{header.title}</h1>
        <p className="mt-2 text-sm font-semibold text-slate-300 sm:text-base">{header.subtitle}</p>
      </header>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {REWARD_SUMMARY.map((reward) => (
          <div
            key={reward.label}
            className={`rounded-xl border border-${header.tone}-400/30 bg-${header.tone}-950/30 p-4`}
          >
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{reward.label}</p>
            <p className={`mt-1 text-lg font-black uppercase ${reward.tone}`}>{reward.value}</p>
          </div>
        ))}
      </div>

      {status ? (
        <p className="mt-5 text-xs font-black uppercase tracking-[0.14em] text-emerald-300">{status}</p>
      ) : null}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        {!isCompleted ? (
          <button
            type="button"
            onClick={handleClaim}
            disabled={isLoading || isLocked}
            className="rounded-md border border-cyan-400/60 bg-cyan-950/80 px-5 py-2.5 text-xs font-black uppercase tracking-[0.14em] text-cyan-100 transition-colors hover:bg-cyan-900/80 disabled:cursor-not-allowed disabled:opacity-45"
          >
            {isLoading ? "Reclamando..." : isLocked ? "Bloqueado" : "Reclamar recompensa"}
          </button>
        ) : null}
        <Link
          href={ACADEMY_TUTORIAL_MAP_ROUTE}
          className="rounded-md border border-slate-600 bg-slate-950/70 px-5 py-2.5 text-center text-xs font-black uppercase tracking-[0.14em] text-slate-200 transition-colors hover:bg-slate-900/80"
        >
          Volver al mapa
        </Link>
      </div>
    </section>
  );
}
