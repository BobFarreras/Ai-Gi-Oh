// src/components/game/board/ui/overlays/BoardStatusOverlays.tsx - Agrupa overlays de estado global del tablero: errores, acciones pendientes, pausa, fusión, cementerio y confirmaciones.
"use client";

import { ICard } from "@/core/entities/ICard";
import { ICombatLogEvent } from "@/core/entities/ICombatLog";
import { IBoardUiError } from "../../hooks/internal/boardError";
import { IPendingZoneReplacement } from "../../hooks/internal/board-state/pending-replacement";
import { BattleBannerCenter } from "../BattleBannerCenter";
import { FusionCinematicLayer } from "../FusionCinematicLayer";
import { PauseOverlay } from "./PauseOverlay";
import { EntityReplacementConfirmOverlay } from "./EntityReplacementConfirmOverlay";
import { TurnAdvanceGuardOverlay } from "./TurnAdvanceGuardOverlay";
import { BoardErrorOverlay } from "./internal/BoardErrorOverlay";
import { BoardZoneBrowsers } from "./internal/BoardZoneBrowsers";
import { IFusionMaterialCandidate, FusionMaterialBrowser } from "./internal/FusionMaterialBrowser";

interface BoardStatusOverlaysProps {
  lastError: IBoardUiError | null;
  pendingActionHint: string | null;
  pendingEntityReplacement: IPendingZoneReplacement | null;
  pendingEntityReplacementTargetCard: ICard | null;
  combatLog: ICombatLogEvent[];
  playerAId: string;
  playerAName: string;
  playerBId: string;
  playerBName: string;
  isPaused: boolean;
  onResumePause: () => void;
  onExitPause?: () => void;
  isFusionCinematicActive?: boolean;
  setIsFusionCinematicActive?: (value: boolean) => void;
  graveyardView: "player" | "opponent" | null;
  graveyardOwnerName: string;
  graveyardCards: ICard[];
  graveyardSelectableCardRefs?: string[];
  fusionDeckView?: "player" | "opponent" | null;
  fusionDeckOwnerName?: string;
  fusionDeckCards?: ICard[];
  destroyedView?: "player" | "opponent" | null;
  destroyedOwnerName?: string;
  destroyedCards?: ICard[];
  onCloseError: () => void;
  onConfirmEntityReplacement: () => void;
  onCancelEntityReplacement: () => void;
  onCloseGraveyard: () => void;
  onCloseFusionDeck?: () => void;
  onCloseDestroyed?: () => void;
  onPreviewCard: (card: ICard) => void;
  pendingAdvanceWarning: "MAIN_SKIP_ACTIONS" | "BATTLE_SKIP_ATTACKS" | null;
  onConfirmAdvancePhase: (disableHelp: boolean) => void;
  onCancelAdvancePhase: () => void;
  externalBannerSignal?: { id: string; left: string; right: string } | null;
  showBattleBanners?: boolean;
  isFusionMaterialBrowserOpen?: boolean;
  fusionMaterialCandidates?: IFusionMaterialCandidate[];
  fusionSelectedCount?: number;
  onSelectFusionMaterial?: (instanceId: string) => void;
}

export function BoardStatusOverlays({
  lastError,
  pendingActionHint,
  pendingEntityReplacement,
  pendingEntityReplacementTargetCard,
  combatLog,
  playerAId,
  playerAName,
  playerBId,
  playerBName,
  isPaused,
  onResumePause,
  onExitPause,
  isFusionCinematicActive = false,
  setIsFusionCinematicActive = () => undefined,
  graveyardView,
  graveyardOwnerName,
  graveyardCards,
  graveyardSelectableCardRefs = [],
  fusionDeckView = null,
  fusionDeckOwnerName = "",
  fusionDeckCards = [],
  destroyedView = null,
  destroyedOwnerName = "",
  destroyedCards = [],
  onCloseError,
  onConfirmEntityReplacement,
  onCancelEntityReplacement,
  onCloseGraveyard,
  onCloseFusionDeck = () => undefined,
  onCloseDestroyed = () => undefined,
  onPreviewCard,
  pendingAdvanceWarning,
  onConfirmAdvancePhase,
  onCancelAdvancePhase,
  externalBannerSignal = null,
  showBattleBanners = true,
  isFusionMaterialBrowserOpen = false,
  fusionMaterialCandidates = [],
  fusionSelectedCount = 0,
  onSelectFusionMaterial = () => undefined,
}: BoardStatusOverlaysProps) {
  return (
    <>
      <BoardErrorOverlay error={lastError} onClose={onCloseError} />

      {pendingActionHint && (
        <div className="absolute left-1/2 top-1/2 z-[155] w-[94%] max-w-4xl -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-amber-300/60 bg-amber-950/90 px-6 py-5 text-amber-100 shadow-[0_0_45px_rgba(251,191,36,0.3)] pointer-events-none">
          <p className="text-sm font-black tracking-[0.16em] uppercase text-amber-300">Acción obligatoria</p>
          <p className="mt-1 text-lg font-black leading-tight sm:text-2xl">{pendingActionHint}</p>
        </div>
      )}
      {pendingEntityReplacement && pendingEntityReplacementTargetCard && (
        <EntityReplacementConfirmOverlay
          zone={pendingEntityReplacement.zone}
          targetCard={pendingEntityReplacementTargetCard}
          onConfirm={onConfirmEntityReplacement}
          onCancel={onCancelEntityReplacement}
        />
      )}

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
      <PauseOverlay isPaused={isPaused} onResume={onResumePause} onExit={onExitPause} />
      <TurnAdvanceGuardOverlay
        warning={pendingAdvanceWarning}
        onConfirm={onConfirmAdvancePhase}
        onCancel={onCancelAdvancePhase}
      />
      <FusionCinematicLayer
        events={combatLog}
        onActiveChange={(active) => {
          if (active !== isFusionCinematicActive) {
            setIsFusionCinematicActive(active);
          }
        }}
      />
      <FusionMaterialBrowser
        isOpen={isFusionMaterialBrowserOpen}
        candidates={fusionMaterialCandidates}
        selectedCount={fusionSelectedCount}
        onSelectMaterial={onSelectFusionMaterial}
      />
   
      <BoardZoneBrowsers
        graveyardView={graveyardView}
        graveyardOwnerName={graveyardOwnerName}
        graveyardCards={graveyardCards}
        graveyardSelectableCardRefs={graveyardSelectableCardRefs}
        fusionDeckView={fusionDeckView}
        fusionDeckOwnerName={fusionDeckOwnerName}
        fusionDeckCards={fusionDeckCards}
        destroyedView={destroyedView}
        destroyedOwnerName={destroyedOwnerName}
        destroyedCards={destroyedCards}
        onCloseGraveyard={onCloseGraveyard}
        onCloseFusionDeck={onCloseFusionDeck}
        onCloseDestroyed={onCloseDestroyed}
        onPreviewCard={onPreviewCard}
      />
    </>
  );
}
