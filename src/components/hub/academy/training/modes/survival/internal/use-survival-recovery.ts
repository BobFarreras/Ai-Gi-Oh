// src/components/hub/academy/training/modes/survival/internal/use-survival-recovery.ts - Coordina el reinicio explícito de una expedición bloqueada.
import { Dispatch, SetStateAction, useCallback } from "react";
import { resetSurvivalRun } from "../survival-api-client";

interface IUseSurvivalRecoveryInput {
  enterBattle: () => Promise<boolean>;
  setError: Dispatch<SetStateAction<string | null>>;
  setIsLoading: Dispatch<SetStateAction<boolean>>;
  setNotice: Dispatch<SetStateAction<string | null>>;
}

/** Cierra la run inconsistente y reutiliza el flujo canónico para emitir la siguiente batalla. */
export function useSurvivalRecovery(input: IUseSurvivalRecoveryInput) {
  const { enterBattle, setError, setIsLoading, setNotice } = input;
  return useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await resetSurvivalRun();
      const restored = await enterBattle();
      if (restored) {
        setNotice("La expedición bloqueada se cerró como derrota. Ya puedes empezar una nueva.");
      }
      return restored;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo restaurar la expedición.");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [enterBattle, setError, setIsLoading, setNotice]);
}
