// src/components/hub/academy/training/modes/tutorial/CombatTutorialRewardOverlay.tsx - Modal final para reclamar la carta de recompensa del tutorial de combate.
"use client";
import { Card } from "@/components/game/card/Card";
import { ICard } from "@/core/entities/ICard";

interface ICombatTutorialRewardOverlayProps {
  isVisible: boolean;
  rewardCard: ICard;
  status: string;
  isLoading: boolean;
  onClaimReward: () => void;
  onClose: () => void;
}

export function CombatTutorialRewardOverlay(props: ICombatTutorialRewardOverlayProps) {
  if (!props.isVisible) return null;
  return (
    <section data-tutorial-overlay="true" className="fixed inset-0 z-[520] flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-sm">
      <article className="w-full max-w-4xl rounded-2xl border border-cyan-400/45 bg-zinc-950/94 p-5 shadow-[0_0_45px_rgba(34,211,238,0.25)]">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">BigLog Tutorial</p>
        <h2 className="mt-2 text-xl font-black uppercase text-cyan-100">Recompensa de Combate</h2>
        <p className="mt-2 text-sm text-slate-200">Has desbloqueado la mágica de fusión de GemGPT. Reclámala para añadirla a tu almacén real.</p>
        <p className="mt-2 text-xs font-bold uppercase tracking-[0.12em] text-emerald-300">{props.status}</p>
        <div className="mt-5 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="flex justify-center md:justify-start">
            <div className="origin-top scale-[0.88] sm:scale-95">
              <Card card={props.rewardCard} />
            </div>
          </div>
          <div className="flex flex-col gap-2 md:min-w-[260px]">
            <button
              type="button"
              data-tutorial-overlay="true"
              disabled={props.isLoading}
              onClick={props.onClaimReward}
              className="rounded-md border border-cyan-300/60 bg-cyan-950/70 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-cyan-100 disabled:opacity-50"
            >
              {props.isLoading ? "Reclamando..." : "Reclamar Carta"}
            </button>
            <button
              type="button"
              data-tutorial-overlay="true"
              onClick={props.onClose}
              className="rounded-md border border-slate-500/60 bg-slate-900/70 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-slate-200"
            >
              Cerrar
            </button>
          </div>
        </div>
      </article>
    </section>
  );
}
