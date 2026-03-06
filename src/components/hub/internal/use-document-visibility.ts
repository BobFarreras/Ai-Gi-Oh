// src/components/hub/internal/use-document-visibility.ts - Hook cliente para pausar trabajo gráfico cuando la pestaña no está visible.
"use client";

import { useEffect, useState } from "react";

export function useDocumentVisibility(): boolean {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const syncVisibility = () => setIsVisible(document.visibilityState !== "hidden");
    syncVisibility();
    document.addEventListener("visibilitychange", syncVisibility);
    return () => document.removeEventListener("visibilitychange", syncVisibility);
  }, []);

  return isVisible;
}
