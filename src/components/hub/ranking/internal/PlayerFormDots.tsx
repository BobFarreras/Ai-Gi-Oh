// src/components/hub/ranking/internal/PlayerFormDots.tsx - Muestra los últimos 5 resultados del jugador como bolitas de color (estilo ficha de fútbol).
"use client";

import { memo } from "react";
import { MatchResult } from "@/services/ranking/get-ranking-data";

interface PlayerFormDotsProps {
  form: MatchResult[];
}

/** Colores de las bolitas: verde=Victoria, rojo=Derrota, amarillo=Empate. */
const DOT_COLORS: Record<MatchResult, string> = {
  W: "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]",
  L: "bg-red-400 shadow-[0_0_6px_rgba(248,113,113,0.6)]",
  D: "bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.6)]",
};

/** Tooltips descriptivos por resultado. */
const DOT_LABEL: Record<MatchResult, string> = {
  W: "Victoria",
  L: "Derrota",
  D: "Empate",
};

/**
 * Muestra los últimos 5 resultados de un jugador como bolitas de color.
 * Inspirado en las fichas de forma de fútbol: verde=win, rojo=loss, amarillo=draw.
 * Los slots vacíos se muestran como puntos grises transparentes.
 */
function PlayerFormDotsComponent({ form }: PlayerFormDotsProps) {
  const dots = Array.from({ length: 5 }, (_, i) => form[i] ?? null);

  return (
    <div className="flex items-center gap-1" aria-label={`Forma reciente: ${form.map((r) => DOT_LABEL[r]).join(", ") || "sin datos"}`}>
      {dots.map((result, i) => (
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
  );
}

export const PlayerFormDots = memo(PlayerFormDotsComponent);
