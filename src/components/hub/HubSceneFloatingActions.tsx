// src/components/hub/HubSceneFloatingActions.tsx - Acciones flotantes del hub para recolar cámara y cerrar sesión.
"use client";

import { LogoutButton } from "@/components/auth/LogoutButton";
import { HubResetCameraButton } from "@/components/hub/HubResetCameraButton";
import { HubToggleNodeLabelsButton } from "@/components/hub/HubToggleNodeLabelsButton";

interface HubSceneFloatingActionsProps {
  canResetCamera: boolean;
  onResetCamera: () => void;
  areNodeLabelsVisible: boolean;
  onToggleNodeLabels: () => void;
}

export function HubSceneFloatingActions({
  canResetCamera,
  onResetCamera,
  areNodeLabelsVisible,
  onToggleNodeLabels,
}: HubSceneFloatingActionsProps) {
  return (
    <div className="pointer-events-auto absolute bottom-[max(0.75rem,env(safe-area-inset-bottom))] right-[max(0.75rem,env(safe-area-inset-right))] z-50 flex items-center gap-2 sm:bottom-6 sm:right-6">
      {canResetCamera ? <HubResetCameraButton onReset={onResetCamera} /> : null}
      <HubToggleNodeLabelsButton isVisible={areNodeLabelsVisible} onToggle={onToggleNodeLabels} />
      <LogoutButton iconOnly confirmBeforeLogout />
    </div>
  );
}
