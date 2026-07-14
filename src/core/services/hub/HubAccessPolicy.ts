// src/core/services/hub/HubAccessPolicy.ts - Centraliza reglas de acceso y bloqueo por progreso del jugador.
import { HubSectionType, IHubSection } from "@/core/entities/hub/IHubSection";
import { IPlayerHubProgress } from "@/core/entities/hub/IPlayerHubProgress";

/** Solo Academy desbloqueada antes de que el jugador inicie el tour guiado. */
const PRE_TOUR_UNLOCKED_TYPES: ReadonlySet<HubSectionType> = new Set(["TRAINING"]);

/** Durante el tour guiado, Market/Arsenal/Story también son accesibles (el tour gestiona qué nodo está activo). */
const HUB_TOUR_UNLOCKED_TYPES: ReadonlySet<HubSectionType> = new Set(["TRAINING", "MARKET", "HOME", "STORY"]);

/** El gate del tutorial está activo mientras el jugador no lo ha completado ni saltado. */
export function isTutorialGateActive(progress: IPlayerHubProgress): boolean {
  return !progress.hasCompletedTutorial && !progress.hasSkippedTutorial;
}

/** El tour guiado está activo en cuanto el jugador ha visto la intro pero aún no ha completado ni saltado el tutorial. */
function isHubTourActive(progress: IPlayerHubProgress): boolean {
  return Boolean(progress.hasSeenAcademyIntro) && isTutorialGateActive(progress);
}

/** Regla central de acceso por tipo de sección según el progreso (única fuente de verdad). */
export function isHubSectionTypeUnlocked(type: HubSectionType, progress: IPlayerHubProgress): boolean {
  if (!isTutorialGateActive(progress)) return true;
  const unlockedTypes = isHubTourActive(progress) ? HUB_TOUR_UNLOCKED_TYPES : PRE_TOUR_UNLOCKED_TYPES;
  return unlockedTypes.has(type);
}

function resolveTutorialGateLock(section: IHubSection, progress: IPlayerHubProgress): IHubSection {
  if (isHubSectionTypeUnlocked(section.type, progress)) {
    return { ...section, isLocked: false, lockReason: null };
  }
  return {
    ...section,
    isLocked: true,
    lockReason: "Completa el tutorial de Academy o usa 'Saltar tutorial' desde la bienvenida.",
  };
}

export function resolveHubSectionLock(section: IHubSection, progress: IPlayerHubProgress): IHubSection {
  if (isTutorialGateActive(progress)) {
    return resolveTutorialGateLock(section, progress);
  }

  return { ...section, isLocked: false, lockReason: null };
}
