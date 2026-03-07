// src/components/hub/HubSceneHudOverlay.tsx - Capa HUD 2D superpuesta para usuario, progreso y sesión dentro del Hub.
"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { IPlayerHubProgress } from "@/core/entities/hub/IPlayerHubProgress";
import { HubProgressSection } from "@/components/hub/HubProgressSection";
import { HubUserSection } from "@/components/hub/HubUserSection";
import { HUB_HUD_ANIMATION_DURATION, HUB_HUD_START_DELAY_MS } from "@/components/hub/internal/hub-entry-timings";

interface HubSceneHudOverlayProps {
  playerLabel?: string;
  progress?: IPlayerHubProgress;
  showMetaNodes: boolean;
  onHudEntrySound?: () => void;
  onHudButtonSound?: () => void;
}

export function HubSceneHudOverlay({
  playerLabel,
  progress,
  showMetaNodes,
  onHudEntrySound,
  onHudButtonSound,
}: HubSceneHudOverlayProps) {
  const [canShowHud, setCanShowHud] = useState(false);
  const hasPlayedEntrySoundRef = useRef(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => setCanShowHud(true), HUB_HUD_START_DELAY_MS);
    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (!showMetaNodes || !canShowHud || hasPlayedEntrySoundRef.current) return;
    onHudEntrySound?.();
    hasPlayedEntrySoundRef.current = true;
  }, [canShowHud, onHudEntrySound, showMetaNodes]);

  return (
    <div className="pointer-events-none absolute inset-0 z-40">
      {showMetaNodes && playerLabel && canShowHud ? (
        <motion.div
          initial={{ x: "120vw" }}
          animate={{ x: 0 }}
          transition={{ duration: HUB_HUD_ANIMATION_DURATION, ease: [0.16, 1, 0.3, 1] }}
          style={{ willChange: "transform" }}
          className="pointer-events-auto absolute bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-[max(0.5rem,env(safe-area-inset-left))] sm:bottom-22 sm:left-auto sm:right-[max(1.5rem,env(safe-area-inset-right))]"
        >
          <HubUserSection playerLabel={playerLabel} />
        </motion.div>
      ) : null}
      {showMetaNodes && progress && canShowHud ? (
        <motion.div
          initial={{ y: "-64vh" }}
          animate={{ y: 0 }}
          transition={{ duration: HUB_HUD_ANIMATION_DURATION, ease: [0.16, 1, 0.3, 1], delay: 0.06 }}
          style={{ willChange: "transform" }}
          className="pointer-events-auto absolute left-1/2 top-[max(0.5rem,env(safe-area-inset-top))] -translate-x-1/2 sm:top-3"
        >
          <HubProgressSection progress={progress} onToggleSound={onHudButtonSound} />
        </motion.div>
      ) : null}
    </div>
  );
}
