// src/components/hub/academy/training/modes/olympus/internal/use-remembered-champion.ts - Recuerda con qué campeón juegas entre visitas.
"use client";
import { useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY = "olympus:last-champion";

/** Notifica a los suscriptores cuando la preferencia cambia en esta misma pestaña. */
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function readStored(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

/**
 * El campeón elegido es una preferencia, no progreso: vive en el navegador y no necesita servidor. Sin
 * esto, cada vuelta al Olimpo reseteaba la selección al primero desbloqueado (GenNvim) y había que
 * volver a elegir el campeón mejorado antes de cada combate.
 *
 * Va por `useSyncExternalStore` y no por estado + efecto porque `localStorage` no existe al renderizar
 * en el servidor: el snapshot del servidor es `null` y el del cliente lee la preferencia guardada.
 */
export function useRememberedChampion(): [string | null, (championId: string) => void] {
  const championId = useSyncExternalStore(subscribe, readStored, () => null);

  const remember = useCallback((next: string) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Modo privado o cuota llena: no se recuerda, pero la sesión sigue usable.
    }
    listeners.forEach((listener) => listener());
  }, []);

  return [championId, remember];
}
