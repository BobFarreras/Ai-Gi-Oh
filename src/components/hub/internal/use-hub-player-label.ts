// src/components/hub/internal/use-hub-player-label.ts - Estado local del label de jugador con bootstrap desde access code y guardado manual.
"use client";

import { useEffect, useRef, useState } from "react";
import { LANDING_PENDING_ACCESS_CODE_STORAGE_KEY, normalizeLandingAccessCode } from "@/components/landing/internal/landing-access-code-storage";
import { updatePlayerProfileNameAction } from "@/components/hub/internal/update-player-profile-name-action";

interface IUseHubPlayerLabelResult {
  playerLabel: string;
  isSavingLabel: boolean;
  labelError: string | null;
  clearLabelError: () => void;
  savePlayerLabel: (nextLabel: string) => Promise<void>;
}

/**
 * Gestiona actualización de nickname en Hub y bootstrap inicial desde landing.
 */
export function useHubPlayerLabel(initialLabel: string): IUseHubPlayerLabelResult {
  const [playerLabel, setPlayerLabel] = useState(initialLabel);
  const [isSavingLabel, setIsSavingLabel] = useState(false);
  const [labelError, setLabelError] = useState<string | null>(null);
  const didBootstrapRef = useRef(false);

  useEffect(() => {
    setPlayerLabel(initialLabel);
  }, [initialLabel]);

  useEffect(() => {
    if (didBootstrapRef.current) return;
    didBootstrapRef.current = true;
    const pendingValue = window.localStorage.getItem(LANDING_PENDING_ACCESS_CODE_STORAGE_KEY);
    const pendingAccessCode = pendingValue ? normalizeLandingAccessCode(pendingValue) : null;
    if (!pendingAccessCode) {
      if (pendingValue) window.localStorage.removeItem(LANDING_PENDING_ACCESS_CODE_STORAGE_KEY);
      return;
    }
    let isCancelled = false;
    const runBootstrap = async () => {
      try {
        const result = await updatePlayerProfileNameAction({
          nickname: pendingAccessCode,
          strategy: "bootstrap_if_default",
        });
        if (!isCancelled && result.applied) setPlayerLabel(result.profile.nickname);
      } catch {
        // En bootstrap silencioso evitamos bloquear Hub por error no crítico.
      } finally {
        window.localStorage.removeItem(LANDING_PENDING_ACCESS_CODE_STORAGE_KEY);
      }
    };
    void runBootstrap();
    return () => {
      isCancelled = true;
    };
  }, []);

  const savePlayerLabel = async (nextLabel: string) => {
    setIsSavingLabel(true);
    setLabelError(null);
    try {
      const result = await updatePlayerProfileNameAction({ nickname: nextLabel, strategy: "force" });
      setPlayerLabel(result.profile.nickname);
    } catch (error) {
      setLabelError(error instanceof Error ? error.message : "No se pudo guardar el nombre.");
      throw error;
    } finally {
      setIsSavingLabel(false);
    }
  };

  return {
    playerLabel,
    isSavingLabel,
    labelError,
    clearLabelError: () => setLabelError(null),
    savePlayerLabel,
  };
}

