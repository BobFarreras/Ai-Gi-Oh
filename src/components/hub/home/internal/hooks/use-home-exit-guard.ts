// src/components/hub/home/internal/hooks/use-home-exit-guard.ts - Gestiona la salida de Arsenal cuando el deck principal está incompleto.
import { useCallback, useState } from "react";
import type { HubModuleSfxId } from "@/components/hub/internal/use-hub-module-sfx";

interface IUseHomeExitGuardInput {
  deckCardCount: number;
  deckSize: number;
  onNavigate: (href: string) => void;
  play: (key: HubModuleSfxId) => void;
}

/**
 * Controla la decisión de salida con deck incompleto sin bloquear al usuario.
 */
export function useHomeExitGuard(input: IUseHomeExitGuardInput) {
  const [isExitDialogOpen, setIsExitDialogOpen] = useState(false);

  const handleBackToHubRequest = useCallback(() => {
    if (input.deckCardCount < input.deckSize) {
      input.play("ERROR_COMMON");
      setIsExitDialogOpen(true);
      return;
    }
    input.onNavigate("/hub");
  }, [input]);

  const closeExitDialog = useCallback(() => setIsExitDialogOpen(false), []);

  const confirmExitToHub = useCallback(() => {
    setIsExitDialogOpen(false);
    input.onNavigate("/hub");
  }, [input]);

  const goToMarket = useCallback(() => {
    setIsExitDialogOpen(false);
    input.onNavigate("/hub/market");
  }, [input]);

  return {
    isExitDialogOpen,
    handleBackToHubRequest,
    closeExitDialog,
    confirmExitToHub,
    goToMarket,
  };
}
