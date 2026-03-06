// src/core/services/hub/HubAccessPolicy.ts - Centraliza reglas de acceso y bloqueo por progreso del jugador.
import { HubSectionType, IHubSection } from "@/core/entities/hub/IHubSection";
import { IPlayerHubProgress } from "@/core/entities/hub/IPlayerHubProgress";

const ALWAYS_UNLOCKED_TYPES: ReadonlySet<HubSectionType> = new Set(["MARKET", "HOME", "TRAINING"]);

export function resolveHubSectionLock(section: IHubSection, progress: IPlayerHubProgress): IHubSection {
  if (ALWAYS_UNLOCKED_TYPES.has(section.type)) {
    return { ...section, isLocked: false, lockReason: null };
  }

  if (section.type === "STORY" && !progress.hasCompletedTutorial) {
    return {
      ...section,
      isLocked: true,
      lockReason: "Completa el entrenamiento para desbloquear historia.",
    };
  }

  if (section.type === "MULTIPLAYER" && progress.medals < 1) {
    return {
      ...section,
      isLocked: true,
      lockReason: "Consigue al menos 1 medalla para desbloquear multijugador.",
    };
  }

  return { ...section, isLocked: false, lockReason: null };
}
