// src/components/game/board/ui/overlays/internal/BoardActionOverlays.tsx - Renderiza overlays de acción obligatoria, reemplazo pendiente y banners de combate.
"use client";

import { ICard } from "@/core/entities/ICard";
import { ICombatLogEvent } from "@/core/entities/ICombatLog";
import { IPendingZoneReplacement } from "@/components/game/board/hooks/internal/board-state/pending-replacement";
import { ITrapActivationPrompt } from "@/components/game/board/hooks/internal/board-state/useBoardUiState";
import { BattleBannerCenter } from "../../BattleBannerCenter";
import { EntityReplacementConfirmOverlay } from "../EntityReplacementConfirmOverlay";
import { DirectDamageBeamOverlay } from "./DirectDamageBeamOverlay";
import { EffectTargetedOverlay } from "./EffectTargetedOverlay";
import { IBattleBannerMessage } from "../../internal/banner/banner-message-policy";

interface IBoardActionOverlaysProps {
  pendingActionHint: string | null;
  pendingTrapActivationPrompt?: ITrapActivationPrompt | null;
  pendingEntityReplacement: IPendingZoneReplacement | null;
  pendingEntityReplacementTargetCard: ICard | null;
  combatLog: ICombatLogEvent[];
  playerAId: string;
  playerAName: string;
  playerBId: string;
  playerBName: string;
  externalBannerSignal: IBattleBannerMessage | null;
  showBattleBanners: boolean;
  onConfirmEntityReplacement: () => void;
  onCancelEntityReplacement: () => void;
}

export function BoardActionOverlays({
  pendingActionHint,
  pendingTrapActivationPrompt = null,
  pendingEntityReplacement,
  pendingEntityReplacementTargetCard,
  combatLog,
  playerAId,
  playerAName,
  playerBId,
  playerBName,
  externalBannerSignal,
  showBattleBanners,
  onConfirmEntityReplacement,
  onCancelEntityReplacement,
}: IBoardActionOverlaysProps) {
  return (
    <>
      <EffectTargetedOverlay events={combatLog} playerAId={playerAId} />
      <DirectDamageBeamOverlay events={combatLog} playerAId={playerAId} />
      {pendingTrapActivationPrompt ? (
        <div className="absolute left-1/2 top-[24%] z-[165] w-[94%] max-w-3xl -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-fuchsia-300/65 bg-fuchsia-950/92 px-6 py-4 text-fuchsia-100 shadow-[0_0_40px_rgba(217,70,239,0.32)] pointer-events-none">
          <p className="text-xs font-black tracking-[0.16em] uppercase text-fuchsia-200">Decisión de trampa</p>
          <p className="mt-1 text-lg font-black leading-tight sm:text-2xl">¿Quieres activar la carta trampa?</p>
        </div>
      ) : null}
      {pendingActionHint ? (
        <div className="absolute left-1/2 top-[34%] z-[155] w-[94%] max-w-4xl -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-amber-300/60 bg-amber-950/90 px-6 py-5 text-amber-100 shadow-[0_0_45px_rgba(251,191,36,0.3)] pointer-events-none">
          <p className="text-sm font-black tracking-[0.16em] uppercase text-amber-300">Acción obligatoria</p>
          <p className="mt-1 text-lg font-black leading-tight sm:text-2xl">{pendingActionHint}</p>
        </div>
      ) : null}
      {pendingEntityReplacement && pendingEntityReplacementTargetCard ? (
        <EntityReplacementConfirmOverlay
          zone={pendingEntityReplacement.zone}
          targetCard={pendingEntityReplacementTargetCard}
          onConfirm={onConfirmEntityReplacement}
          onCancel={onCancelEntityReplacement}
        />
      ) : null}
      {showBattleBanners ? (
        <BattleBannerCenter
          events={combatLog}
          playerAId={playerAId}
          playerAName={playerAName}
          playerBId={playerBId}
          playerBName={playerBName}
          externalBannerSignal={externalBannerSignal}
        />
      ) : null}
    </>
  );
}
