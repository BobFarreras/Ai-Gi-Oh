// src/components/game/board/ui/internal/duel-result-overlay/DuelResultMobileContent.tsx - Layout del resultado final optimizado para viewport móvil.
import { Card } from "@/components/game/card/Card";
import { IDuelResultRewardSummary } from "@/components/game/board/ui/internal/duel-result/duel-result-reward-summary";
import type { IAppliedCardExperienceResult } from "@/core/use-cases/progression/ApplyBattleCardExperienceUseCase";
import { ICard } from "@/core/entities/ICard";
import { DuelResultActionButton } from "@/components/game/board/ui/internal/duel-result-overlay/DuelResultActionButton";
import { DuelResultExperienceContent } from "@/components/game/board/ui/internal/duel-result-overlay/DuelResultExperienceContent";

interface IDuelResultMobileContentProps {
  rewardSummary?: IDuelResultRewardSummary | null;
  mobileTab: "CARDS" | "GIFT";
  onSelectTab: (tab: "CARDS" | "GIFT") => void;
  battleExperienceSummary: IAppliedCardExperienceResult[];
  battleExperienceCardLookup: Record<string, ICard>;
  isBattleExperiencePending: boolean;
  rewardCard: ICard | null;
  actionLabel: string;
  onAction: () => void;
}

export function DuelResultMobileContent({
  rewardSummary,
  mobileTab,
  onSelectTab,
  battleExperienceSummary,
  battleExperienceCardLookup,
  isBattleExperiencePending,
  rewardCard,
  actionLabel,
  onAction,
}: IDuelResultMobileContentProps) {
  return (
    <>
      {rewardSummary && (
        <div className="grid grid-cols-3 gap-2 rounded-lg border border-cyan-900/40 bg-black/30 p-2 text-center">
          <div><p className="text-[9px] font-black uppercase tracking-widest text-cyan-400">EXP</p><p className="text-sm font-black text-white">+{rewardSummary.rewardPlayerExperience}</p></div>
          <div><p className="text-[9px] font-black uppercase tracking-widest text-emerald-400">Nexus</p><p className="text-sm font-black text-white">+{rewardSummary.rewardNexus}</p></div>
          <div><p className="text-[9px] font-black uppercase tracking-widest text-amber-400">Regalo</p><p className="text-sm font-black text-white">{rewardSummary.rewardCards.length}</p></div>
        </div>
      )}
      <div className="flex items-center gap-2">
        <button aria-label="Ver cartas con experiencia" onClick={() => onSelectTab("CARDS")} className={`flex-1 rounded border px-3 py-2 text-[10px] font-black uppercase tracking-wider ${mobileTab === "CARDS" ? "border-cyan-300/70 bg-cyan-500/15 text-cyan-100" : "border-zinc-700 bg-zinc-900/60 text-zinc-400"}`}>Cartas</button>
        <button aria-label="Ver carta regalo" onClick={() => onSelectTab("GIFT")} className={`flex-1 rounded border px-3 py-2 text-[10px] font-black uppercase tracking-wider ${mobileTab === "GIFT" ? "border-amber-300/70 bg-amber-500/15 text-amber-100" : "border-zinc-700 bg-zinc-900/60 text-zinc-400"}`}>Regalo</button>
      </div>
      <div className="flex-1 min-h-0 p-1 overflow-hidden">
        {mobileTab === "CARDS" ? (
          <DuelResultExperienceContent
            battleExperienceSummary={battleExperienceSummary}
            battleExperienceCardLookup={battleExperienceCardLookup}
            isBattleExperiencePending={isBattleExperiencePending}
            density="compact"
            emptyLabelClassName="text-xs uppercase tracking-widest text-zinc-500"
            gridClassName="grid grid-cols-3 justify-items-center gap-1 pb-2"
            wrapperClassName="h-full overflow-y-auto custom-scrollbar pr-1"
          />
        ) : rewardCard ? (
          <div className="flex h-full items-center justify-center"><div className="origin-top scale-[0.65]"><Card card={rewardCard} /></div></div>
        ) : (
          <div className="flex h-full items-center justify-center"><p className="text-xs uppercase tracking-widest text-zinc-500">No hay carta regalo.</p></div>
        )}
      </div>
      <DuelResultActionButton
        label={actionLabel}
        onClick={onAction}
        className="group relative w-full py-3 bg-cyan-950/80 border border-cyan-400/60 text-cyan-50 font-black uppercase tracking-[0.2em] text-xs rounded-xl hover:bg-cyan-900 transition-all overflow-hidden shadow-[0_0_15px_rgba(34,211,238,0.15)] hover:shadow-[0_0_25px_rgba(34,211,238,0.4)]"
      />
    </>
  );
}

