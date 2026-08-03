// src/components/hub/academy/training/modes/survival/internal/survival-progress.ts - Deriva la lectura visual del avance de una expedición.

export interface ISurvivalProgressInput {
  currentLp: number;
  maxLp: number;
  wins: number;
  milestoneInterval: number;
  milestoneHeal: number;
}

export interface ISurvivalProgressReadout {
  /** Fracción de LP viva, 0..1. Es la mecánica central del modo: lo que conservas es con lo que sigues. */
  lpRatio: number;
  /** Victorias acumuladas dentro del ciclo de hito actual. */
  winsIntoMilestone: number;
  /** Victorias que faltan para la próxima curación; 0 cuando el modo no cura. */
  winsToMilestone: number;
  /** LP que tendrías tras la curación del próximo hito, sin pasar del máximo. */
  healedLpPreview: number;
  /** Fracción que ocuparía esa curación en la barra, para pintarla como tramo fantasma. */
  healPreviewRatio: number;
  /** Por debajo de un cuarto de vida la barra pasa a lectura de alarma. */
  isCritical: boolean;
}

const clampRatio = (value: number): number => Math.min(1, Math.max(0, value));

/**
 * Todo sale de valores que ya derivó el servidor; aquí solo se traduce a fracciones pintables. El
 * preview de curación se calcula con el mismo tope que aplica la RPC, para no prometer LP imposibles.
 */
export function resolveSurvivalProgress(input: ISurvivalProgressInput): ISurvivalProgressReadout {
  const maxLp = Math.max(1, input.maxLp);
  const currentLp = Math.max(0, Math.min(input.currentLp, maxLp));
  const lpRatio = clampRatio(currentLp / maxLp);
  const interval = Math.max(0, Math.floor(input.milestoneInterval));
  const wins = Math.max(0, Math.floor(input.wins));

  const winsIntoMilestone = interval > 0 ? wins % interval : 0;
  const winsToMilestone = interval > 0 ? interval - winsIntoMilestone : 0;
  const healedLpPreview = Math.min(maxLp, currentLp + Math.max(0, input.milestoneHeal));

  return {
    lpRatio,
    winsIntoMilestone,
    winsToMilestone,
    healedLpPreview,
    healPreviewRatio: clampRatio((healedLpPreview - currentLp) / maxLp),
    isCritical: lpRatio <= 0.25,
  };
}
