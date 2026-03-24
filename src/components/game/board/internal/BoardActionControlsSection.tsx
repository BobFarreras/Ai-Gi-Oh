// src/components/game/board/internal/BoardActionControlsSection.tsx - Renderiza controles flotantes y paneles de acciones del tablero.
import { BoardActionButtons } from "@/components/game/board/ui/layout/BoardActionButtons";
import { BoardMobileActionsFab } from "@/components/game/board/ui/layout/BoardMobileActionsFab";
import { BoardMobilePanelsDialog } from "@/components/game/board/ui/overlays/BoardMobilePanelsDialog";
import { IBoardViewSectionProps } from "@/components/game/board/internal/board-view-types";

export function BoardActionControlsSection({ board, screen, isMobile }: IBoardViewSectionProps) {
  if (screen.isResultVisible) return null;

  const toggleAutoPhase = () => {
    board.playBanner();
    board.toggleAutoPhase();
    const nextEnabled = !board.isAutoPhaseEnabled;
    screen.setAutoModeBannerSignal({
      id: `auto-mode-${Date.now()}-${nextEnabled ? "on" : "off"}`,
      left: "Modo Automático",
      right: nextEnabled ? "Activado" : "Desactivado",
    });
  };

  return (
    <>
      {isMobile && (
        <BoardMobilePanelsDialog
          selectedCard={null}
          gameState={board.gameState}
          isHistoryOpen={board.isHistoryOpen}
          onSelectCard={board.previewCard}
          onCloseCard={board.clearSelection}
          onCloseHistory={() => board.setIsHistoryOpen(false)}
        />
      )}
      {isMobile ? (
        <BoardMobileActionsFab
          isMuted={board.isMuted}
          isPaused={board.isPaused}
          isAutoPhaseEnabled={board.isAutoPhaseEnabled}
          isHistoryOpen={board.isHistoryOpen}
          canSetSelectedEntityToAttack={board.canSetSelectedEntityToAttack}
          onToggleMute={() => {
            board.playButtonClick();
            board.toggleMute();
          }}
          onTogglePause={() => {
            board.playButtonClick();
            board.togglePause();
          }}
          onToggleAutoPhase={toggleAutoPhase}
          onToggleHistory={() => {
            board.playButtonClick();
            // Evita doble panel lateral (detalle + log) que degrada el layout en viewports ajustados.
            board.clearSelection();
            board.setIsHistoryOpen((previous) => !previous);
          }}
          onSetSelectedEntityToAttack={() => {
            board.playButtonClick();
            board.setSelectedEntityToAttack();
          }}
        />
      ) : (
        <BoardActionButtons
          isMuted={board.isMuted}
          isPaused={board.isPaused}
          isAutoPhaseEnabled={board.isAutoPhaseEnabled}
          isHistoryOpen={board.isHistoryOpen}
          canSetSelectedEntityToAttack={board.canSetSelectedEntityToAttack}
          canActivateSelectedExecution={board.canActivateSelectedExecution}
          onToggleMute={() => {
            board.playButtonClick();
            board.toggleMute();
          }}
          onTogglePause={() => {
            board.playButtonClick();
            board.togglePause();
          }}
          onToggleAutoPhase={toggleAutoPhase}
          onToggleHistory={() => {
            board.playButtonClick();
            // Evita doble panel lateral (detalle + log) que degrada el layout en viewports ajustados.
            board.clearSelection();
            board.setIsHistoryOpen((previous) => !previous);
          }}
          onSetSelectedEntityToAttack={() => {
            board.playButtonClick();
            board.setSelectedEntityToAttack();
          }}
          onActivateSelectedExecution={() => {
            board.playButtonClick();
            screen.handleActivateSelectedExecution();
          }}
        />
      )}
    </>
  );
}
