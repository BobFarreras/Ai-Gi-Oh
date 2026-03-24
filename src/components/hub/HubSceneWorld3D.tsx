// src/components/hub/HubSceneWorld3D.tsx - Encapsula el mundo 3D del hub (suelo, cámara y nodos) con perfil adaptativo.
"use client";

import { useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { MeshReflectorMaterial } from "@react-three/drei";
import { IHubMapNode } from "@/core/entities/hub/IHubMapNode";
import { HubSectionType, IHubSection } from "@/core/entities/hub/IHubSection";
import { HubSceneCameraControls } from "@/components/hub/HubSceneCameraControls";
import { HubSceneNode3D } from "@/components/hub/HubSceneNode3D";
import { HUB_NODE_STAGGER_DELAY } from "@/components/hub/internal/hub-entry-timings";
import { HUB_SCENE_FLOOR_CONFIG } from "@/components/hub/internal/hub-scene-floor-config";
import { resolveFloorConfigForProfile, resolveHubRenderProfile } from "@/components/hub/internal/hub-render-profile";
import { useHubDeviceCapability } from "@/components/hub/internal/use-hub-device-capability";

interface HubSceneWorld3DProps {
  sections: IHubSection[];
  nodes: IHubMapNode[];
  viewportWidth: number;
  isDocumentVisible: boolean;
  cameraResetSignal: number;
  cameraPosition: [number, number, number];
  cameraTarget: [number, number, number];
  areNodeLabelsVisible: boolean;
  onNodeHoverSound: () => void;
  onNavigate: (nodeId: string, href: string) => void;
  activeNodeId: string | null;
  isNavigationBusy: boolean;
}

export function HubSceneWorld3D({
  sections,
  nodes,
  viewportWidth,
  isDocumentVisible,
  cameraResetSignal,
  cameraPosition,
  cameraTarget,
  areNodeLabelsVisible,
  onNodeHoverSound,
  onNavigate,
  activeNodeId,
  isNavigationBusy,
}: HubSceneWorld3DProps) {
  const capability = useHubDeviceCapability();
  const sectionsByType = useMemo(
    () => new Map<HubSectionType, IHubSection>(sections.map((section) => [section.type, section])),
    [sections],
  );
  const renderProfile = useMemo(
    () => resolveHubRenderProfile(viewportWidth, capability),
    [capability, viewportWidth],
  );
  const floorConfig = useMemo(
    () => resolveFloorConfigForProfile(HUB_SCENE_FLOOR_CONFIG, renderProfile),
    [renderProfile],
  );

  return (
    <Canvas
      camera={{ position: cameraPosition, fov: 45 }}
      dpr={renderProfile.dpr}
      gl={{ antialias: false, powerPreference: "high-performance" }}
      frameloop={isDocumentVisible ? "always" : "never"}
      className="cursor-grab active:cursor-grabbing"
    >
      <ambientLight intensity={0.3} />
      <directionalLight position={[10, 20, 10]} intensity={1.2} color="#0ea5e9" />
      <directionalLight position={[-15, 10, -15]} intensity={0.5} color="#38bdf8" />
      <group position={[0, -0.05, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[floorConfig.planeSize, floorConfig.planeSize]} />
          <MeshReflectorMaterial
            blur={floorConfig.blur}
            resolution={floorConfig.reflectionResolution}
            mixBlur={1}
            mixStrength={floorConfig.reflectionStrength}
            roughness={floorConfig.roughness}
            depthScale={1.2}
            minDepthThreshold={0.4}
            maxDepthThreshold={1.4}
            color={floorConfig.planeColor}
            metalness={floorConfig.metalness}
            mirror={0}
          />
        </mesh>
        <gridHelper
          args={[floorConfig.gridSize, floorConfig.gridDivisions, floorConfig.gridPrimaryColor, floorConfig.gridSecondaryColor]}
          position={[0, 0.01, 0]}
        />
      </group>
      <HubSceneCameraControls resetSignal={cameraResetSignal} desiredPosition={cameraPosition} desiredTarget={cameraTarget} />
      {nodes.map((node, index) => {
        const section = sectionsByType.get(node.sectionType);
        if (!section) return null;
        return (
          <HubSceneNode3D
            key={node.id}
            node={node}
            section={section}
            nodeEntryDelay={index * HUB_NODE_STAGGER_DELAY}
            onNodeHoverSound={onNodeHoverSound}
            showActionPanel={areNodeLabelsVisible}
            onNavigate={onNavigate}
            activeNodeId={activeNodeId}
            isNavigationBusy={isNavigationBusy}
          />
        );
      })}
    </Canvas>
  );
}
