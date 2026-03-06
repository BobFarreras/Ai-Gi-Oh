// src/components/hub/boot/HubSceneBootLoader.tsx - Orquesta la transición de arranque y monta la escena del hub al finalizar.
"use client";

import { useEffect, useState } from "react";
import { IHubMapNode } from "@/core/entities/hub/IHubMapNode";
import { IHubSection } from "@/core/entities/hub/IHubSection";
import { IPlayerHubProgress } from "@/core/entities/hub/IPlayerHubProgress";
import { HubBootTransition } from "@/components/hub/boot/HubBootTransition";
import { HubScene } from "@/components/hub/HubScene";
import { HUB_BOOT_LOADING_MS, HUB_BOOT_OPENING_MS } from "@/components/hub/internal/hub-boot-timings";

interface HubSceneBootLoaderProps {
  playerLabel: string;
  progress: IPlayerHubProgress;
  sections: IHubSection[];
  nodes: IHubMapNode[];
}

export function HubSceneBootLoader({ playerLabel, progress, sections, nodes }: HubSceneBootLoaderProps) {
  const [phase, setPhase] = useState<"loading" | "opening" | "ready">("loading");

  useEffect(() => {
    const loadingTimer = window.setTimeout(() => setPhase("opening"), HUB_BOOT_LOADING_MS);
    const readyTimer = window.setTimeout(() => setPhase("ready"), HUB_BOOT_LOADING_MS + HUB_BOOT_OPENING_MS);
    return () => {
      window.clearTimeout(loadingTimer);
      window.clearTimeout(readyTimer);
    };
  }, []);

  return (
    <div className="relative">
      {phase === "ready" ? (
        <HubScene playerLabel={playerLabel} progress={progress} showMetaNodes sections={sections} nodes={nodes} />
      ) : null}
      {phase !== "ready" ? <HubBootTransition phase={phase} /> : null}
    </div>
  );
}
