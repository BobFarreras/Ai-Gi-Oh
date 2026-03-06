// src/components/game/board/ui/overlays/BoardStatusOverlays.tsx - Agrupa overlays de estado global del tablero: errores, acciones pendientes, pausa, fusión, cementerio y confirmaciones.
"use client";

import { ICard } from "@/core/entities/ICard";
import { ICombatLogEvent } from "@/core/entities/ICombatLog";
import { BattleMode } from "@/core/entities/IPlayer";
import { IBoardUiError } from "../../hooks/internal/boardError";
import { BattleBannerCenter } from "../BattleBannerCenter";
import { FusionCinematicLayer } from "../FusionCinematicLayer";
import { GraveyardBrowser } from "../GraveyardBrowser";
import { PauseOverlay } from "./PauseOverlay";
import { EntityReplacementConfirmOverlay } from "./EntityReplacementConfirmOverlay";

interface BoardStatusOverlaysProps {
  lastError: IBoardUiError | null;
  pendingActionHint: string | null;
  pendingEntityReplacement: { cardId: string; mode: BattleMode } | null;
  pendingEntityReplacementTargetCard: ICard | null;
  combatLog: ICombatLogEvent[];
  playerAId: string;
  playerAName: string;
  playerBId: string;
  playerBName: string;
  isPaused: boolean;
  onResumePause: () => void;
  isFusionCinematicActive?: boolean;
  setIsFusionCinematicActive?: (value: boolean) => void;
  graveyardView: "player" | "opponent" | null;
  graveyardOwnerName: string;
  graveyardCards: ICard[];
  onCloseError: () => void;
  onConfirmEntityReplacement: () => void;
  onCancelEntityReplacement: () => void;
  onCloseGraveyard: () => void;
  onPreviewCard: (card: ICard) => void;
 
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
  isFusionCinematicActive = false,
  setIsFusionCinematicActive = () => undefined,
  graveyardView,
  graveyardOwnerName,
  graveyardCards,
  onCloseError,
  onConfirmEntityReplacement,
  onCancelEntityReplacement,
  onCloseGraveyard,
  onPreviewCard,
  
}: BoardStatusOverlaysProps) {
  return (
    <>
      {lastError && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-140 w-[92%] max-w-xl bg-red-950/90 border border-red-500/60 text-red-100 px-5 py-4 rounded-xl shadow-[0_0_35px_rgba(239,68,68,0.4)]">
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <p className="text-xs font-black tracking-wider uppercase text-red-300">{lastError.code}</p>
              <p className="text-sm font-semibold">{lastError.message}</p>
            </div>
            <button
              aria-label="Cerrar mensaje de error"
              onClick={(event) => {
                event.stopPropagation();
                onCloseError();
              }}
              className="text-red-200 hover:text-white font-black"
            >
              X
            </button>
          </div>
        </div>
      )}

      {pendingActionHint && (
        <div className="absolute top-28 left-1/2 -translate-x-1/2 z-130 w-[92%] max-w-3xl bg-amber-950/85 border border-amber-400/50 text-amber-100 px-5 py-3 rounded-xl shadow-[0_0_35px_rgba(251,191,36,0.25)]">
          <p className="text-xs font-black tracking-wider uppercase text-amber-300">Acción obligatoria</p>
          <p className="text-sm font-semibold">{pendingActionHint}</p>
        </div>
      )}
      {pendingEntityReplacement && pendingEntityReplacementTargetCard && (
        <EntityReplacementConfirmOverlay
          targetCard={pendingEntityReplacementTargetCard}
          onConfirm={onConfirmEntityReplacement}
          onCancel={onCancelEntityReplacement}
        />
      )}

      <BattleBannerCenter events={combatLog} playerAId={playerAId} playerAName={playerAName} playerBId={playerBId} playerBName={playerBName} />
      <PauseOverlay isPaused={isPaused} onResume={onResumePause} />
      <FusionCinematicLayer
        events={combatLog}
        onActiveChange={(active) => {
          if (active !== isFusionCinematicActive) {
            setIsFusionCinematicActive(active);
          }
        }}
      />
   
      <GraveyardBrowser
        isOpen={graveyardView !== null}
        ownerName={graveyardOwnerName}
        cards={graveyardCards}
        onClose={onCloseGraveyard}
        onSelectCard={onPreviewCard}
      />
    </>
  );
}
