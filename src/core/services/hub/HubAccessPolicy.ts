// src/core/services/hub/HubAccessPolicy.ts - Centraliza reglas de acceso y bloqueo por progreso del jugador.
import { HubSectionType, IHubSection } from "@/core/entities/hub/IHubSection";
import { IPlayerHubProgress } from "@/core/entities/hub/IPlayerHubProgress";

const TUTORIAL_GATE_UNLOCKED_TYPES: ReadonlySet<HubSectionType> = new Set(["TRAINING"]);

function isTutorialGateActive(progress: IPlayerHubProgress): boolean {
  return !progress.hasCompletedTutorial && !progress.hasSkippedTutorial;
}

function resolveTutorialGateLock(section: IHubSection): IHubSection {
  if (TUTORIAL_GATE_UNLOCKED_TYPES.has(section.type)) {
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
    return resolveTutorialGateLock(section);
  }

  if (section.type === "MULTIPLAYER") {
    return {
      ...section,
      isLocked: true,
      lockReason: "Multijugador en proceso de creación. Próximamente disponible.",
    };
  }

  return { ...section, isLocked: false, lockReason: null };
}
