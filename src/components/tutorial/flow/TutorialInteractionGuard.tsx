// src/components/tutorial/flow/TutorialInteractionGuard.tsx - Bloquea interacciones fuera de los objetivos activos del tutorial.
"use client";
import { useEffect } from "react";

interface ITutorialInteractionGuardProps {
  isEnabled: boolean;
  allowedTargetIds: string[];
}

const ALWAYS_ALLOWED_TARGET_IDS = ["tutorial-board-actions-menu", "tutorial-board-mute-button"];

function isInsideAllowedTarget(target: EventTarget | null, allowedTargetIds: string[]): boolean {
  if (!(target instanceof Element)) return false;
  if (target.closest("[data-tutorial-overlay='true']")) return true;
  const effectiveAllowedIds = [...ALWAYS_ALLOWED_TARGET_IDS, ...allowedTargetIds];
  return effectiveAllowedIds.some((targetId) => Boolean(target.closest(`[data-tutorial-id="${targetId}"]`)));
}

export function TutorialInteractionGuard({ isEnabled, allowedTargetIds }: ITutorialInteractionGuardProps) {
  useEffect(() => {
    if (!isEnabled) return;
    const captureHandler = (event: Event) => {
      if (isInsideAllowedTarget(event.target, allowedTargetIds)) return;
      event.preventDefault();
      event.stopPropagation();
      if ("stopImmediatePropagation" in event && typeof event.stopImmediatePropagation === "function") event.stopImmediatePropagation();
    };
    const keydownHandler = (event: KeyboardEvent) => {
      if (event.key !== "Tab" && event.key !== "Enter" && event.key !== " ") return;
      if (isInsideAllowedTarget(event.target, allowedTargetIds)) return;
      event.preventDefault();
      event.stopPropagation();
    };
    document.addEventListener("click", captureHandler, true);
    document.addEventListener("pointerdown", captureHandler, true);
    document.addEventListener("keydown", keydownHandler, true);
    return () => {
      document.removeEventListener("click", captureHandler, true);
      document.removeEventListener("pointerdown", captureHandler, true);
      document.removeEventListener("keydown", keydownHandler, true);
    };
  }, [isEnabled, allowedTargetIds]);
  return null;
}
