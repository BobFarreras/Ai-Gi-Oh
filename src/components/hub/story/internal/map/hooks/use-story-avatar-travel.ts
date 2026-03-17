// src/components/hub/story/internal/map/hooks/use-story-avatar-travel.ts - Gestiona movimiento visual del avatar Story entre nodos con estado de tránsito.
"use client";

import { animate, useMotionValue } from "framer-motion";
import { useEffect, useRef } from "react";
import { IStoryCircuitPosition } from "@/components/hub/story/internal/map/layout/story-circuit-layout";

interface IUseStoryAvatarTravelInput {
  targetNodeId: string | null;
  resolvePosition: (nodeId: string) => IStoryCircuitPosition;
}

interface IUseStoryAvatarTravelOutput {
  avatarX: ReturnType<typeof useMotionValue<number>>;
  avatarY: ReturnType<typeof useMotionValue<number>>;
}

/**
 * Mantiene un desplazamiento continuo del avatar para evitar saltos abruptos entre nodos.
 */
export function useStoryAvatarTravel(input: IUseStoryAvatarTravelInput): IUseStoryAvatarTravelOutput {
  const avatarX = useMotionValue(1000);
  const avatarY = useMotionValue(1000);
  const previousNodeId = useRef<string | null>(null);

  useEffect(() => {
    if (!input.targetNodeId) return;
    const targetPosition = input.resolvePosition(input.targetNodeId);
    const previousId = previousNodeId.current;

    if (!previousId) {
      avatarX.set(targetPosition.x);
      avatarY.set(targetPosition.y);
      previousNodeId.current = input.targetNodeId;
      return;
    }

    if (previousId === input.targetNodeId) return;

    const fromPosition = input.resolvePosition(previousId);
    const arcPeakY = Math.min(fromPosition.y, targetPosition.y) - 90;

    const xControls = animate(avatarX, [fromPosition.x, (fromPosition.x + targetPosition.x) / 2, targetPosition.x], {
      duration: 0.85,
      ease: "easeInOut",
    });
    const yControls = animate(avatarY, [fromPosition.y, arcPeakY, targetPosition.y], {
      duration: 0.85,
      ease: "easeInOut",
    });

    previousNodeId.current = input.targetNodeId;

    return () => {
      xControls.stop();
      yControls.stop();
    };
  }, [avatarX, avatarY, input]);

  return { avatarX, avatarY };
}
