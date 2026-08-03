// src/components/game/board/multiplayer/local-action-emitter.tsx - Canal opcional para emitir las acciones del jugador local hacia el rival (solo multijugador).
"use client";

import { createContext, useContext } from "react";
import { IMatchActionPayload } from "@/core/entities/multiplayer/IMatchAction";

export type LocalActionEmitter = (action: IMatchActionPayload, actorPlayerId?: string) => void;

const noop: LocalActionEmitter = () => {};

const LocalActionEmitterContext = createContext<LocalActionEmitter>(noop);

export const LocalActionEmitterProvider = LocalActionEmitterContext.Provider;

/**
 * Devuelve el emisor de acciones locales. Fuera de una partida multijugador es
 * un noop, de modo que los handlers del tablero (compartidos por todos los modos)
 * pueden emitir sin condicionales ni acoplarse al multijugador.
 */
export function useLocalActionEmitter(): LocalActionEmitter {
  return useContext(LocalActionEmitterContext);
}
