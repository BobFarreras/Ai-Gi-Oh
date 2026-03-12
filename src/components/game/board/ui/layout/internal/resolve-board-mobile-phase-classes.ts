// src/components/game/board/ui/layout/internal/resolve-board-mobile-phase-classes.ts - Resuelve estilos de botones de fase móvil por estado y variante visual.
interface IResolveBoardMobilePhaseClassesInput {
  isMain: boolean;
  isBattle: boolean;
  canAdvance: boolean;
  cinematic: boolean;
}

interface IBoardMobilePhaseClasses {
  invoke: string;
  battle: string;
  pass: string;
}

const activeInvokeClass = "border-cyan-400/80 bg-cyan-950/70 text-cyan-200";
const activeBattleClass = "border-amber-400/80 bg-amber-950/70 text-amber-200";
const activePassClass = "border-fuchsia-500/65 bg-zinc-900/80 text-fuchsia-300";
const idleClass = "border-zinc-700/80 bg-zinc-900/70 text-zinc-500";
const actionableBattleClass = "border-amber-500/60 bg-zinc-900/80 text-amber-300";

function withCinematicGlow(enabled: boolean, baseClass: string, glowClass: string): string {
  if (!enabled) return baseClass;
  return `${baseClass} ${glowClass}`;
}

/**
 * Centraliza la decisión de clases para evitar duplicación entre modo estático y animado.
 */
export function resolveBoardMobilePhaseClasses(input: IResolveBoardMobilePhaseClassesInput): IBoardMobilePhaseClasses {
  const invoke = input.isMain ? withCinematicGlow(input.cinematic, activeInvokeClass, "shadow-[0_0_14px_rgba(34,211,238,0.25)]") : idleClass;
  const battle = input.isBattle
    ? withCinematicGlow(input.cinematic, activeBattleClass, "shadow-[0_0_14px_rgba(251,191,36,0.25)]")
    : input.canAdvance && input.isMain
      ? actionableBattleClass
      : idleClass;
  const pass = input.canAdvance && input.isBattle
    ? withCinematicGlow(input.cinematic, activePassClass, "shadow-[0_0_14px_rgba(217,70,239,0.22)]")
    : idleClass;
  return { invoke, battle, pass };
}
