// src/components/hub/academy/training/modes/tutorial/CombatTutorialRewardOverlay.tsx - Modal final para reclamar la carta de recompensa del tutorial de combate.
"use client";
import { Card } from "@/components/game/card/Card";
import { ICard } from "@/core/entities/ICard";

interface ICombatTutorialRewardOverlayProps {
  isVisible: boolean;
  rewardCard: ICard;
  rewardNexus: number;
  status: string;
  isLoading: boolean;
  title?: string;
  subtitle?: string;
  description?: string;
  claimLabel?: string;
  closeLabel?: string;
  hideClaimButton?: boolean;
  hideCloseButton?: boolean;
  onClaimReward: () => void;
  onClose: () => void;
}

export function CombatTutorialRewardOverlay(props: ICombatTutorialRewardOverlayProps) {
  if (!props.isVisible) return null;
  return (
    <section data-tutorial-overlay="true" className="fixed inset-0 z-[520] flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-sm">
      <article className="relative w-full max-w-4xl max-h-[calc(100dvh-1rem)] overflow-hidden rounded-2xl border border-cyan-400/45 bg-zinc-950/94 p-3 shadow-[0_0_45px_rgba(34,211,238,0.25)] sm:p-5">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(34,211,238,0.16),transparent_40%),radial-gradient(circle_at_82%_18%,rgba(16,185,129,0.14),transparent_42%)]" />
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-300 sm:text-xs sm:tracking-[0.2em]">{props.subtitle ?? "BigLog Tutorial"}</p>
        <h2 className="mt-1 text-lg font-black uppercase text-cyan-100 sm:mt-2 sm:text-xl">{props.title ?? "Recompensa Final"}</h2>
        <p className="mt-1 text-xs leading-snug text-slate-200 sm:mt-2 sm:text-sm">{props.description ?? "Has completado el tutorial de combate. Reclama la carta final y los Nexus en un único cierre."}</p>
        <p className="mt-1 inline-flex rounded-md border border-emerald-300/50 bg-emerald-900/35 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-200 sm:mt-2 sm:px-3 sm:text-xs sm:tracking-[0.14em]">
          +{props.rewardNexus} Nexus
        </p>
        <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.1em] text-emerald-300 sm:mt-2 sm:text-xs sm:tracking-[0.12em]">{props.status}</p>
        <div className="mt-2 grid grid-cols-[minmax(118px,132px)_1fr] items-end gap-2.5 sm:mt-5 sm:flex sm:flex-row sm:items-end sm:justify-between sm:gap-4">
          <div className="flex justify-center sm:justify-start">
            <div className="relative h-[194px] w-[132px] min-[390px]:h-[212px] min-[390px]:w-[145px] sm:h-[266px] sm:w-[182px]">
              <div className="absolute left-0 top-0 origin-top-left scale-[0.507] min-[390px]:scale-[0.557] sm:scale-[0.7]">
                <Card card={props.rewardCard} />
              </div>
            </div>
          </div>
          <div className="flex w-full flex-col gap-1.5 self-end sm:gap-2 md:min-w-[260px] md:max-w-[320px]">
            <button
              type="button"
              data-tutorial-overlay="true"
              disabled={props.isLoading}
              onClick={props.onClaimReward}
              className="w-full rounded-md border border-cyan-300/60 bg-cyan-950/70 px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-cyan-100 disabled:opacity-50 sm:px-4 sm:text-xs sm:tracking-[0.14em]"
              hidden={props.hideClaimButton}
            >
              {props.isLoading ? "Reclamando..." : props.claimLabel ?? "Reclamar Recompensa Final"}
            </button>
            <button
              type="button"
              data-tutorial-overlay="true"
              onClick={props.onClose}
              className="w-full rounded-md border border-slate-500/60 bg-slate-900/70 px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-slate-200 sm:px-4 sm:text-xs sm:tracking-[0.14em]"
              hidden={props.hideCloseButton}
            >
              {props.closeLabel ?? "Cerrar"}
            </button>
          </div>
        </div>
      </article>
    </section>
  );
}
