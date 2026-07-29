// src/components/hub/home/internal/hooks/use-home-inspector-status.ts - Gestiona feedback temporal de acciones del inspector.
import { useEffect, useState } from "react";

export interface IHomeInspectorStatus {
  tone: "success" | "error";
  text: string;
}

/** Mantiene el mensaje visible el tiempo suficiente sin dejar temporizadores activos al desmontar. */
export function useHomeInspectorStatus() {
  const [statusMessage, setStatusMessage] = useState<IHomeInspectorStatus | null>(null);

  useEffect(() => {
    if (!statusMessage) return;
    const delayMs = statusMessage.tone === "error" ? 2600 : 1400;
    const timer = window.setTimeout(() => setStatusMessage(null), delayMs);
    return () => window.clearTimeout(timer);
  }, [statusMessage]);

  return { statusMessage, setStatusMessage };
}
