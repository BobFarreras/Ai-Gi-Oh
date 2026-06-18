// src/components/hub/multiplayer/internal/use-multiplayer-lobby-sfx.ts - Wrapper del catálogo de SFX del Hub con mapeo semántico a eventos del lobby multijugador.
"use client";

import { useCallback } from "react";
import { useHubModuleSfx, HubModuleSfxId } from "@/components/hub/internal/use-hub-module-sfx";

/**
 * Mapea eventos del lobby multijugador a IDs del catálogo global de SFX.
 * Centraliza la semántica para que los componentes solo disparen eventos de
 * dominio (invite sent, match found, invitation accepted, etc.).
 */
export type MultiplayerLobbySfxEvent =
  | "INVITE_SENT"
  | "MATCH_FOUND"
  | "INVITATION_RECEIVED"
  | "INVITATION_ACCEPTED"
  | "INVITATION_DECLINED"
  | "ERROR";

const EVENT_TO_SFX: Record<MultiplayerLobbySfxEvent, HubModuleSfxId> = {
  INVITE_SENT: "INVITE_SENT",
  MATCH_FOUND: "MATCH_FOUND",
  INVITATION_RECEIVED: "DETAIL_OPEN",
  INVITATION_ACCEPTED: "DIALOG_CLOSE",
  INVITATION_DECLINED: "FILTER_CLOSE",
  ERROR: "ERROR_COMMON",
};

export function useMultiplayerLobbySfx() {
  const { play } = useHubModuleSfx();

  const playEvent = useCallback(
    (event: MultiplayerLobbySfxEvent) => {
      play(EVENT_TO_SFX[event]);
    },
    [play],
  );

  return { play: playEvent };
}
