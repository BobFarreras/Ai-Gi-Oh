// src/components/hub/HubScene.tsx - Escena principal del hub con HUD 2D superpuesto y mapa 3D interactivo.
"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { IHubMapNode } from "@/core/entities/hub/IHubMapNode";
import { IHubSection } from "@/core/entities/hub/IHubSection";
import { IPlayerHubProgress } from "@/core/entities/hub/IPlayerHubProgress";
import { HubSceneFloatingActions } from "@/components/hub/HubSceneFloatingActions";
import { HubSceneHudOverlay } from "@/components/hub/HubSceneHudOverlay";
import { HubSceneFallback2D } from "@/components/hub/HubSceneFallback2D";
import { HubSceneWorld3D } from "@/components/hub/HubSceneWorld3D";
import { resolveHubCameraPose } from "@/components/hub/internal/hub-camera-fit";
import { applyResponsiveNodeLayout } from "@/components/hub/internal/hub-node-responsive-layout";
import { supportsWebGL } from "@/components/hub/internal/hub-webgl-support";
import { useDocumentVisibility } from "@/components/hub/internal/use-document-visibility";
import { useHubSfx } from "@/components/hub/internal/use-hub-sfx";
import { useViewportWidth } from "@/components/hub/internal/use-viewport-width";

interface HubSceneProps {
  playerLabel?: string;
  progress?: IPlayerHubProgress;
  showMetaNodes?: boolean;
  forceFallbackForTests?: boolean;
  sections: IHubSection[];
  nodes: IHubMapNode[];
}

export function HubScene({
  playerLabel,
  progress,
  showMetaNodes = false,
  forceFallbackForTests = false,
  sections,
  nodes,
}: HubSceneProps) {
  const router = useRouter();
  const isDocumentVisible = useDocumentVisibility();
  const viewportWidth = useViewportWidth();
  const { playHudEntry, playNodeHover } = useHubSfx();
  const [cameraResetSignal, setCameraResetSignal] = useState(0);
  const [areNodeLabelsVisible, setAreNodeLabelsVisible] = useState(true);
  const canRender3D = useMemo(
    () => (forceFallbackForTests ? false : supportsWebGL()),
    [forceFallbackForTests],
  );
  const responsiveNodes = useMemo(() => applyResponsiveNodeLayout(nodes, viewportWidth), [nodes, viewportWidth]);
  const cameraPose = useMemo(() => resolveHubCameraPose(responsiveNodes, viewportWidth), [responsiveNodes, viewportWidth]);

  return (
    <section className="relative h-dvh w-full overflow-hidden">
      <HubSceneHudOverlay
        playerLabel={playerLabel}
        progress={progress}
        showMetaNodes={showMetaNodes}
        onHudEntrySound={playHudEntry}
      />
      <HubSceneFloatingActions
        canResetCamera={canRender3D}
        onResetCamera={() => setCameraResetSignal((previous) => previous + 1)}
        areNodeLabelsVisible={areNodeLabelsVisible}
        onToggleNodeLabels={() => setAreNodeLabelsVisible((previous) => !previous)}
      />
      <div className="absolute inset-0 z-10 bg-[#010610]">
        {!canRender3D ? (
          <HubSceneFallback2D
            sections={sections}
            nodes={responsiveNodes}
            onNavigate={(href) => router.push(href)}
            onNodeHoverSound={playNodeHover}
            areNodeLabelsVisible={areNodeLabelsVisible}
          />
        ) : null}
        {canRender3D ? (
          <HubSceneWorld3D
            sections={sections}
            nodes={responsiveNodes}
            viewportWidth={viewportWidth}
            isDocumentVisible={isDocumentVisible}
            cameraResetSignal={cameraResetSignal}
            cameraPosition={cameraPose.position}
            cameraTarget={cameraPose.target}
            areNodeLabelsVisible={areNodeLabelsVisible}
            onNodeHoverSound={playNodeHover}
          />
        ) : null}
      </div>
    </section>
  );
}
