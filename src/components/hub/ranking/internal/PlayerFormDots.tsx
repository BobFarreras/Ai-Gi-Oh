// src/components/hub/ranking/internal/PlayerFormDots.tsx - Forma reciente (últimas 5 partidas): "queso" de 5 secciones en móvil (compacto) y bolitas en fila en escritorio.
"use client";

import { memo } from "react";
import { MatchResult } from "@/services/ranking/get-ranking-data";

interface PlayerFormDotsProps {
  form: MatchResult[];
}

/** Colores de las bolitas (escritorio): verde=Victoria, rojo=Derrota, amarillo=Empate. */
const DOT_COLORS: Record<MatchResult, string> = {
  W: "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]",
  L: "bg-red-400 shadow-[0_0_6px_rgba(248,113,113,0.6)]",
  D: "bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.6)]",
};

/** Relleno de las secciones del queso (móvil). */
const SECTION_FILL: Record<MatchResult, string> = {
  W: "#34d399",
  L: "#f87171",
  D: "#fbbf24",
};
const EMPTY_FILL = "rgba(113,113,122,0.35)";

/** Tooltips descriptivos por resultado. */
const DOT_LABEL: Record<MatchResult, string> = {
  W: "Victoria",
  L: "Derrota",
  D: "Empate",
};

// Geometría del queso: 5 sectores de 72° con un pequeño hueco entre ellos. El más reciente arriba.
const R = 11;
const CX = 12;
const CY = 12;
const GAP_DEG = 5;

function polar(angleDeg: number): [number, number] {
  const a = ((angleDeg - 90) * Math.PI) / 180; // -90° → 0° apunta arriba; ángulo creciente = sentido horario.
  return [CX + R * Math.cos(a), CY + R * Math.sin(a)];
}

function wedgePath(index: number): string {
  const [x0, y0] = polar(index * 72 + GAP_DEG / 2);
  const [x1, y1] = polar((index + 1) * 72 - GAP_DEG / 2);
  return `M ${CX} ${CY} L ${x0.toFixed(2)} ${y0.toFixed(2)} A ${R} ${R} 0 0 1 ${x1.toFixed(2)} ${y1.toFixed(2)} Z`;
}

/**
 * Forma reciente de un jugador (últimas 5 partidas). En **móvil** se dibuja como un "queso" de 5
 * secciones (ocupa mucho menos y deja sitio al nombre); en **escritorio** se mantienen las 5 bolitas
 * en fila (verde=win, rojo=loss, amarillo=draw; vacío=gris). Un solo hijo del grid (wrapper).
 */
function PlayerFormDotsComponent({ form }: PlayerFormDotsProps) {
  const slots = Array.from({ length: 5 }, (_, i) => form[i] ?? null);
  const label = `Forma reciente: ${form.map((r) => DOT_LABEL[r]).join(", ") || "sin datos"}`;

  return (
    <div className="shrink-0">
      {/* Móvil: queso de 5 secciones */}
      <svg viewBox="0 0 24 24" className="block h-6 w-6 sm:hidden" role="img" aria-label={label}>
        {slots.map((result, i) => (
          <path
            key={i}
            d={wedgePath(i)}
            fill={result ? SECTION_FILL[result] : EMPTY_FILL}
            stroke="#0b1220"
            strokeWidth="0.6"
          />
        ))}
      </svg>

      {/* Escritorio: 5 bolitas en fila */}
      <div className="hidden items-center gap-1 sm:flex" aria-label={label}>
        {slots.map((result, i) => (
          <span
            key={i}
            className={`inline-block h-2.5 w-2.5 rounded-full transition-all ${
              result ? DOT_COLORS[result] : "bg-zinc-700/50"
            }`}
            title={result ? DOT_LABEL[result] : undefined}
            aria-hidden="true"
          />
        ))}
      </div>
    </div>
  );
}

export const PlayerFormDots = memo(PlayerFormDotsComponent);
