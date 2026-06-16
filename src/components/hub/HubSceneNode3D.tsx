// src/components/hub/HubSceneNode3D.tsx - Nodo tridimensional del hub con núcleo 3D, color por sección y panel accesible.
"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { IHubMapNode } from "@/core/entities/hub/IHubMapNode";
import { IHubSection } from "@/core/entities/hub/IHubSection";
import { HubNodeActionPanel } from "@/components/hub/HubNodeActionPanel";
import { resolveHubNodeInteraction } from "@/components/hub/internal/hub-node-interaction";
import { resolveHubNodeEntryScale } from "@/components/hub/internal/hub-node-entry-animation";
import { resolveHubNodeBaseColor, resolveHubNodeWorldPosition } from "@/components/hub/internal/hub-3d-node-math";
import { HUB_NODE_PANEL_Y_OFFSET } from "@/components/hub/internal/hub-node-panel-layout";
import { createNodeBaseMaterials } from "@/components/hub/internal/hub-node-base-materials";
import { areHubSceneNode3DPropsEqual } from "@/components/hub/internal/hub-scene-node3d-props-equality";
import { MarketCore3D } from "./nodes/market/MarketCore3D";
import { HomeCore3D } from "./nodes/HubNodeDecorHome";
import { MultiplayerCore3D } from "./nodes/HubNodeDecorMultiplayer";
import { StoryCore3D } from "./nodes/HubNodeDecorStory";
import { TrainingCore3D } from "./nodes/HubNodeDecorTraining";

// Geometrías compartidas de la base del nodo; reducimos segmentos imperceptibles a esta escala.
const nodeBaseCircleGeometry = new THREE.CircleGeometry(1.8, 24);
const nodeBaseOuterRingGeometry = new THREE.RingGeometry(1.78, 1.8, 48);
const nodeBaseInnerRingGeometry = new THREE.RingGeometry(1.4, 1.42, 24, 1, 0, Math.PI * 2);
const nodeBaseSpokeGeometry = new THREE.PlaneGeometry(0.04, 0.2);

interface HubSceneNode3DProps {
  node: IHubMapNode;
  section: IHubSection;
  nodeEntryDelay?: number;
  onNodeHoverSound?: () => void;
  showActionPanel?: boolean;
  onNavigate: (nodeId: string, href: string) => void;
  isTargetNode: boolean;
  isNavigationBusy: boolean;
  isDisabled: boolean;
}

function HubSceneNode3DComponent({
  node,
  section,
  nodeEntryDelay = 0,
  onNodeHoverSound,
  showActionPanel = true,
  onNavigate,
  isTargetNode,
  isNavigationBusy,
  isDisabled,
}: HubSceneNode3DProps) {
  const nodeRef = useRef<THREE.Group>(null);
  const baseRef = useRef<THREE.Group>(null);
  const entryTimeRef = useRef(0);
  const [isLockReasonVisible, setIsLockReasonVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const { x: posX, z: posZ } = resolveHubNodeWorldPosition(node.positionX, node.positionY);
  const baseColor = resolveHubNodeBaseColor(section.type);
  const baseMaterials = useMemo(() => createNodeBaseMaterials(baseColor), [baseColor]);

  const handleNodeAction = useCallback(() => {
    if (isDisabled) return;
    const result = resolveHubNodeInteraction(section);
    if (result.kind === "locked") {
      setIsLockReasonVisible((previous) => !previous);
      return;
    }
    onNavigate(node.id, result.href);
  }, [isDisabled, section, node.id, onNavigate]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.style.cursor = isHovered ? "pointer" : "";
    return () => {
      document.body.style.cursor = "";
    };
  }, [isHovered]);

  useFrame((_, delta) => {
    if (nodeRef.current) {
      entryTimeRef.current += delta;
      const entryScale = resolveHubNodeEntryScale(entryTimeRef.current, nodeEntryDelay);
      const hoverScale = isHovered ? 1.08 : 1;
      const targetScale = entryScale * hoverScale;
      const currentScale = nodeRef.current.scale.x;
      const nextScale = THREE.MathUtils.lerp(currentScale, targetScale, 0.14);
      nodeRef.current.scale.set(nextScale, nextScale, nextScale);
    }
    if (baseRef.current) {
      baseRef.current.rotation.z -= delta * 0.1; 
    }
  });

  return (
    <group ref={nodeRef} position={[posX, 0, posZ]} scale={[0, 0, 0]}>
      <group
        position={[0, 1.5, 0]}
        onClick={handleNodeAction}
        onPointerDown={(event) => event.stopPropagation()}
        onPointerOver={(event) => {
          event.stopPropagation();
          if (isDisabled) return;
          if (!isHovered) onNodeHoverSound?.();
          setIsHovered(true);
        }}
        onPointerOut={(event) => {
          event.stopPropagation();
          if (isDisabled) return;
          setIsHovered(false);
        }}
      >
         {section.type === "MARKET" && <MarketCore3D />}
         {section.type === "HOME" && <HomeCore3D />}
         {section.type === "MULTIPLAYER" && <MultiplayerCore3D />}
         {section.type === "STORY" && <StoryCore3D />}
         {section.type === "TRAINING" && <TrainingCore3D />}
      </group>

      <group rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} ref={baseRef}>
        <mesh geometry={nodeBaseCircleGeometry} material={baseMaterials.circle} />
        <mesh geometry={nodeBaseOuterRingGeometry} material={baseMaterials.outerRing} />
        <mesh geometry={nodeBaseInnerRingGeometry} material={baseMaterials.innerRing} />
        {[0, Math.PI/2, Math.PI, Math.PI*1.5].map((angle, i) => (
          <mesh key={i} rotation={[0, 0, angle]} position={[0, 0, 0.01]} geometry={nodeBaseSpokeGeometry} material={baseMaterials.spoke} />
        ))}
      </group>

      {showActionPanel ? (
        <Html
          center
        position={[0, HUB_NODE_PANEL_Y_OFFSET, 0]}
        transform
        sprite
        distanceFactor={12}
        zIndexRange={[0, 0]}
        className="pointer-events-auto"
        >
          <HubNodeActionPanel
            section={section}
            baseColor={baseColor}
            isHovered={isHovered}
            isLockReasonVisible={isLockReasonVisible}
            onAction={handleNodeAction}
            isNavigationBusy={isNavigationBusy}
            isTargetNode={isTargetNode}
            isDisabled={isDisabled}
          />
        </Html>
      ) : null}
    </group>
  );
}

export const HubSceneNode3D = memo(HubSceneNode3DComponent, areHubSceneNode3DPropsEqual);
