// src/components/hub/internal/use-document-visibility.ts - Hook cliente para pausar trabajo gráfico cuando la pestaña no está visible.
"use client";

import { useSyncExternalStore } from "react";

/**
 * `visibilitychange` no basta en móvil. Al volver a la app, el navegador restaura la página desde
 * bfcache y dispara `pageshow` sin garantizar un `visibilitychange`: la escena se quedaba con
 * `frameloop="never"` y el 3D congelado mientras las animaciones CSS seguían corriendo, y solo
 * recargar lo arreglaba. `focus` cubre además volver a la ventana en escritorio.
 */
const VISIBILITY_EVENTS = ["visibilitychange", "pageshow", "focus"] as const;

/** `visibilitychange` solo lo emite el documento; `pageshow` y `focus`, la ventana. */
function targetFor(event: (typeof VISIBILITY_EVENTS)[number]): EventTarget {
  return event === "visibilitychange" ? document : window;
}

function subscribe(onStoreChange: () => void): () => void {
  for (const event of VISIBILITY_EVENTS) targetFor(event).addEventListener(event, onStoreChange);
  return () => {
    for (const event of VISIBILITY_EVENTS) targetFor(event).removeEventListener(event, onStoreChange);
  };
}

export function useDocumentVisibility(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => document.visibilityState !== "hidden",
    // En servidor se asume visible: así el primer render ya trae la escena viva.
    () => true,
  );
}
