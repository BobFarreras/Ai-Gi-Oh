// src/components/hub/internal/use-viewport-width.ts - Hook para observar ancho de viewport de forma estable y segura en cliente.
"use client";

import { useSyncExternalStore } from "react";

function subscribe(callback: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;
  window.addEventListener("resize", callback, { passive: true });
  return () => window.removeEventListener("resize", callback);
}

function getServerSnapshot(): number {
  return 1280;
}

function getSnapshot(): number {
  if (typeof window === "undefined") return getServerSnapshot();
  return window.innerWidth;
}

export function useViewportWidth(): number {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
