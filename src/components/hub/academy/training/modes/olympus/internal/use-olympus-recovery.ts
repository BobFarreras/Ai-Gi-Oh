// src/components/hub/academy/training/modes/olympus/internal/use-olympus-recovery.ts - Coordina la recuperación del combate bloqueado.
import { Dispatch, SetStateAction, useCallback } from "react";
import { IOlympusBattleRuntime, IOlympusSettlement, resetOlympusBattle } from "../olympus-api-client";

interface IUseOlympusRecoveryInput {
  reloadOverview: () => Promise<void>;
  setBattle: Dispatch<SetStateAction<IOlympusBattleRuntime | null>>;
  setSettlement: Dispatch<SetStateAction<IOlympusSettlement | null>>;
  setError: Dispatch<SetStateAction<string | null>>;
  setIsLoading: Dispatch<SetStateAction<boolean>>;
}

/** Cierra la batalla inconsistente y vuelve al selector con el allowance recalculado por el servidor. */
export function useOlympusRecovery(input: IUseOlympusRecoveryInput) {
  const { reloadOverview, setBattle, setSettlement, setError, setIsLoading } = input;
  return useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await resetOlympusBattle();
      setBattle(null);
      setSettlement(null);
      await reloadOverview();
      return true;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo restaurar el combate de Olimpo.");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [reloadOverview, setBattle, setError, setIsLoading, setSettlement]);
}
