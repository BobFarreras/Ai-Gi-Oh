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
import { HubOnboardingIntroOverlay } from "@/components/hub/onboarding/HubOnboardingIntroOverlay";
import { resolveHubCameraPose, resolveHubNodeFocusPose } from "@/components/hub/internal/hub-camera-fit";
import { applyResponsiveNodeLayout } from "@/components/hub/internal/hub-node-responsive-layout";
import { supportsWebGL } from "@/components/hub/internal/hub-webgl-support";
import { useDocumentVisibility } from "@/components/hub/internal/use-document-visibility";
import { useHubNodeNavigation } from "@/components/hub/internal/use-hub-node-navigation";
import { useHubRoutePrefetch } from "@/components/hub/internal/use-hub-route-prefetch";
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
  const { playHudEntry, playNodeHover, playUiClick } = useHubSfx();
  const { navigationState, isNavigationBusy, isRouteSlow, requestNavigation } = useHubNodeNavigation({ router });
  const [cameraResetSignal, setCameraResetSignal] = useState(0);
  const [areNodeLabelsVisible, setAreNodeLabelsVisible] = useState(true);
  const canRender3D = useMemo(
    () => (forceFallbackForTests ? false : supportsWebGL()),
    [forceFallbackForTests],
  );
  const responsiveNodes = useMemo(() => applyResponsiveNodeLayout(nodes, viewportWidth), [nodes, viewportWidth]);
  const cameraPose = useMemo(() => resolveHubCameraPose(responsiveNodes, viewportWidth), [responsiveNodes, viewportWidth]);
  const sectionHrefs = useMemo(() => sections.map((section) => section.href), [sections]);
  const activeNode = useMemo(
    () => responsiveNodes.find((node) => node.id === navigationState.targetNodeId) ?? null,
    [navigationState.targetNodeId, responsiveNodes],
  );
  const activeCameraPose = useMemo(
    () => (activeNode ? resolveHubNodeFocusPose(activeNode, viewportWidth) : cameraPose),
    [activeNode, cameraPose, viewportWidth],
  );
  useHubRoutePrefetch({ router, hrefs: sectionHrefs });

  return (
    <section className="relative h-dvh w-full overflow-hidden">
      <HubOnboardingIntroOverlay progress={progress} />
      <HubSceneHudOverlay
        playerLabel={playerLabel}
        progress={progress}
        showMetaNodes={showMetaNodes}
        onHudEntrySound={playHudEntry}
        onHudButtonSound={playUiClick}
      />
      <HubSceneFloatingActions
        canResetCamera={canRender3D}
        onResetCamera={() => setCameraResetSignal((previous) => previous + 1)}
        areNodeLabelsVisible={areNodeLabelsVisible}
        onToggleNodeLabels={() => setAreNodeLabelsVisible((previous) => !previous)}
        onHudButtonSound={playUiClick}
      />
      <div className="absolute inset-0 z-10 bg-[#010610]">
        {!canRender3D ? (
          <HubSceneFallback2D
            sections={sections}
            nodes={responsiveNodes}
            onNavigate={requestNavigation}
            onNodeHoverSound={playNodeHover}
            areNodeLabelsVisible={areNodeLabelsVisible}
            activeNodeId={navigationState.targetNodeId}
            isNavigationBusy={isNavigationBusy}
          />
        ) : null}
        {canRender3D ? (
          <HubSceneWorld3D
            sections={sections}
            nodes={responsiveNodes}
            viewportWidth={viewportWidth}
            isDocumentVisible={isDocumentVisible}
            cameraResetSignal={cameraResetSignal}
            cameraPosition={activeCameraPose.position}
            cameraTarget={activeCameraPose.target}
            areNodeLabelsVisible={areNodeLabelsVisible}
            onNodeHoverSound={playNodeHover}
            onNavigate={requestNavigation}
            activeNodeId={navigationState.targetNodeId}
            isNavigationBusy={isNavigationBusy}
          />
        ) : null}
        {isRouteSlow ? (
          <div className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center bg-black/35">
            <div className="rounded-lg border border-cyan-500/45 bg-[#041120]/90 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-cyan-100">
              Sincronizando modulo...
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
