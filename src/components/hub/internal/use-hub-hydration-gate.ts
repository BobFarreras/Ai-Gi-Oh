// src/components/hub/internal/use-hub-hydration-gate.ts - Gate de hidratación para evitar mismatch SSR/cliente en el hub 3D.
"use client";

import { useSyncExternalStore } from "react";

interface IHubHydrationGate {
  /** true solo en cliente; false durante el render del servidor. */
  isHydrated: boolean;
}

function noopSubscribe(): () => void {
  return () => {};
}

/**
 * Hook SSR-seguro que reporta `false` en servidor y `true` en cliente.
 * Usa useSyncExternalStore para evitar setState en efecto y garantizar el mismo snapshot inicial.
 */
export function useHubHydrationGate(): IHubHydrationGate {
  const isHydrated = useSyncExternalStore(noopSubscribe, () => true, () => false);
  return { isHydrated };
}
