// src/components/game/board/internal/resolve-board-theme-classes.ts - Resuelve capas ambientales coherentes para cada tema de tablero.
import type { BoardBossThemeVariant } from "@/components/game/board";

interface IBoardThemeClasses {
  ambient: string;
  vignette: string;
}

const DEFAULT_THEME: IBoardThemeClasses = {
  ambient: "absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(34,211,238,0.12),transparent_52%)] pointer-events-none",
  vignette: "absolute inset-0 shadow-[inset_0_0_200px_rgba(1,4,12,0.58)] pointer-events-none",
};

/** Evita que las variantes frías hereden accidentalmente el halo carmesí de los bosses. */
export function resolveBoardThemeClasses(
  isBossTheme: boolean,
  variant: BoardBossThemeVariant,
): IBoardThemeClasses {
  if (!isBossTheme) return DEFAULT_THEME;
  if (variant === "CYAN") {
    return {
      ambient: "absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(16,185,129,0.14),transparent_52%)] pointer-events-none",
      vignette: "absolute inset-0 shadow-[inset_0_0_210px_rgba(2,44,34,0.68)] pointer-events-none",
    };
  }
  return {
    ambient: "absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(244,63,94,0.14),transparent_52%)] pointer-events-none",
    vignette: "absolute inset-0 shadow-[inset_0_0_210px_rgba(44,7,16,0.64)] pointer-events-none",
  };
}
