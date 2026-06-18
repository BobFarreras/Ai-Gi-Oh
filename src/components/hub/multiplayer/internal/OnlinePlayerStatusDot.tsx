// src/components/hub/multiplayer/internal/OnlinePlayerStatusDot.tsx - Indicador de presencia estable con glow estático por estado del jugador.
import { memo } from "react";
import { OnlinePlayerStatus } from "@/core/entities/multiplayer/IOnlinePlayer";

/**
 * Mapa de clases por estado: color de fondo + glow barato (box-shadow estático,
 * sin animación, para no quemar GPU en listas largas de jugadores online).
 */
const STATUS_DOT_CLASS: Record<OnlinePlayerStatus, string> = {
  IDLE: "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.85)]",
  IN_LOBBY: "bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.85)]",
  IN_MATCH: "bg-rose-400 shadow-[0_0_6px_rgba(248,113,113,0.85)]",
};

interface OnlinePlayerStatusDotProps {
  status: OnlinePlayerStatus;
  /** Tamaño en píxeles (por defecto 8). */
  size?: number;
}

/**
 * Punto de estado de presencia. Render puro, sin animaciones: el glow es
 * box-shadow estático (regla 5 de performance-rendering-guardrails: prohibido
 * animar box-shadow en bucle; aquí es estático, OK).
 */
function OnlinePlayerStatusDotComponent({ status, size = 8 }: OnlinePlayerStatusDotProps) {
  return (
    <span
      aria-hidden
      className={`shrink-0 rounded-full ${STATUS_DOT_CLASS[status]}`}
      style={{ width: size, height: size }}
    />
  );
}

export const OnlinePlayerStatusDot = memo(OnlinePlayerStatusDotComponent);
