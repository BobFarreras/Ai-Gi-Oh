// src/core/hooks/multiplayer/useForfeitOnUnload.ts - Envía un forfeit (outcome LOSE) al cerrar la pestaña si la partida sigue activa, para penalizar al abandonador.
"use client";

import { useEffect, useRef } from "react";

interface IUseForfeitOnUnloadParams {
  matchId: string;
  /**
   * Si true, NO envía el beacon. Combinación recomendada en el caller:
   * `matchFinished || Boolean(winnerPlayerId) || isOpponentGone`.
   * Así el ganador que cierra tras detectar fin o ver abandono del rival
   * no se penaliza a sí mismo enviando LOSE.
   */
  suppressForfeit: boolean;
  /** Endpoint de cierre de partida. Por defecto el del módulo multijugador. */
  endpoint?: string;
}

/**
 * Construye el body del beacon como Blob application/json para que el route
 * handler lo parsee con request.json(). Extraída para permitir tests puros.
 */
export function buildForfeitBlob(matchId: string): Blob {
  return new Blob([JSON.stringify({ matchId, outcome: "LOSE" })], { type: "application/json" });
}

/**
 * Registra beforeunload/pagehide para enviar forfeit al servidor cuando el
 * jugador local abandona la partida (cierra pestaña o navega fuera). El
 * servidor marca match_sessions=FINISHED con winner_id=el rival, lo que
 * notifica al ganador vía postgres_changes (useMatchFinishListener) y aplica
 * penalización de ELO/losses al abandonador. Idempotente: si suppressForfeit
 * es true, no envía nada.
 */
export function useForfeitOnUnload({ matchId, suppressForfeit, endpoint = "/api/multiplayer/match/finish" }: IUseForfeitOnUnloadParams): void {
  const suppressRef = useRef(suppressForfeit);
  useEffect(() => {
    suppressRef.current = suppressForfeit;
  });

  useEffect(() => {
    function handleUnload(): void {
      if (suppressRef.current) return;
      const blob = buildForfeitBlob(matchId);
      if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
        navigator.sendBeacon(endpoint, blob);
        return;
      }
      // Fallback para navegadores sin sendBeacon: keepalive mantiene la petición tras cerrar.
      void fetch(endpoint, { method: "POST", body: blob, keepalive: true }).catch(() => undefined);
    }
    window.addEventListener("beforeunload", handleUnload);
    window.addEventListener("pagehide", handleUnload);
    return () => {
      window.removeEventListener("beforeunload", handleUnload);
      window.removeEventListener("pagehide", handleUnload);
    };
  }, [matchId, endpoint]);
}
