// src/components/hub/HubSceneFloatingActions.tsx - Acciones flotantes del hub para recolar cámara y cerrar sesión.
"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { HubResetCameraButton } from "@/components/hub/HubResetCameraButton";
import { HubToggleNodeLabelsButton } from "@/components/hub/HubToggleNodeLabelsButton";
import { HUB_HUD_ANIMATION_DURATION, HUB_HUD_START_DELAY_MS } from "@/components/hub/internal/hub-entry-timings";

interface HubSceneFloatingActionsProps {
  canResetCamera: boolean;
  onResetCamera: () => void;
  areNodeLabelsVisible: boolean;
  onToggleNodeLabels: () => void;
  onHudButtonSound?: () => void;
}

export function HubSceneFloatingActions({
  canResetCamera,
  onResetCamera,
  areNodeLabelsVisible,
  onToggleNodeLabels,
  onHudButtonSound,
}: HubSceneFloatingActionsProps) {
  const [canShowActions, setCanShowActions] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => setCanShowActions(true), HUB_HUD_START_DELAY_MS + 40);
    return () => window.clearTimeout(timeout);
  }, []);

  if (!canShowActions) return null;

  return (
    <motion.div
      initial={{ y: "30vh", opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: HUB_HUD_ANIMATION_DURATION, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
      style={{ willChange: "transform,opacity" }}
      className="pointer-events-auto absolute bottom-[max(0.75rem,env(safe-area-inset-bottom))] right-[max(0.75rem,env(safe-area-inset-right))] z-50 flex items-center gap-2 sm:bottom-6 sm:right-6"
    >
      {canResetCamera ? <HubResetCameraButton onReset={onResetCamera} onActionSound={onHudButtonSound} /> : null}
      <HubToggleNodeLabelsButton isVisible={areNodeLabelsVisible} onToggle={onToggleNodeLabels} onActionSound={onHudButtonSound} />
      <LogoutButton iconOnly confirmBeforeLogout onActionSound={onHudButtonSound} />
    </motion.div>
  );
}
