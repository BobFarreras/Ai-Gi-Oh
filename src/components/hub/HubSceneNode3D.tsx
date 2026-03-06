// src/components/hub/HubSceneNode3D.tsx - Nodo tridimensional del hub con núcleo 3D, color por sección y panel accesible.
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
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

// Importamos los núcleos
import { MarketCore3D } from "./nodes/market/MarketCore3D";
import { HomeCore3D } from "./nodes/HubNodeDecorHome";
import { MultiplayerCore3D } from "./nodes/HubNodeDecorMultiplayer";
import { StoryCore3D } from "./nodes/HubNodeDecorStory";
import { TrainingCore3D } from "./nodes/HubNodeDecorTraining";

interface HubSceneNode3DProps {
  node: IHubMapNode;
  section: IHubSection;
  nodeEntryDelay?: number;
  onNodeHoverSound?: () => void;
  showActionPanel?: boolean;
}

export function HubSceneNode3D({
  node,
  section,
  nodeEntryDelay = 0,
  onNodeHoverSound,
  showActionPanel = true,
}: HubSceneNode3DProps) {
  const router = useRouter();
  const nodeRef = useRef<THREE.Group>(null);
  const baseRef = useRef<THREE.Group>(null);
  const [isLockReasonVisible, setIsLockReasonVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const { x: posX, z: posZ } = resolveHubNodeWorldPosition(node.positionX, node.positionY);
  const baseColor = resolveHubNodeBaseColor(section.type);

  const handleNodeAction = () => {
    const result = resolveHubNodeInteraction(section);
    if (result.kind === "locked") {
      setIsLockReasonVisible((previous) => !previous);
      return;
    }
    router.push(result.href);
  };

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.style.cursor = isHovered ? "pointer" : "";
    return () => {
      document.body.style.cursor = "";
    };
  }, [isHovered]);

  useFrame((_, delta) => {
    if (nodeRef.current) {
      const entryScale = resolveHubNodeEntryScale(_.clock.elapsedTime, nodeEntryDelay);
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
      
      {/* 💡 FIX DE ILUMINACIÓN: Luz puntual propia para cada nodo.
          Esto hace que el material PBR (meshStandardMaterial) brille perfectamente
          sin importar dónde esté el "sol" de la escena global. */}
      <pointLight 
        position={[0, 1.5, 0]} // Posicionada justo en el centro del holograma
        intensity={8}          // Intensidad alta para que parezca un neón
        distance={5}           // Rango de la luz
        color={baseColor} 
      />

      {/* 1. EL NÚCLEO HOLOGRÁFICO 3D */}
      <group
        position={[0, 1.5, 0]}
        onClick={handleNodeAction}
        onPointerDown={(event) => event.stopPropagation()}
        onPointerOver={(event) => {
          event.stopPropagation();
          if (!isHovered) onNodeHoverSound?.();
          setIsHovered(true);
        }}
        onPointerOut={(event) => {
          event.stopPropagation();
          setIsHovered(false);
        }}
      >
         {section.type === "MARKET" && <MarketCore3D />}
         {section.type === "HOME" && <HomeCore3D />}
         {section.type === "MULTIPLAYER" && <MultiplayerCore3D />}
         {section.type === "STORY" && <StoryCore3D />}
         {section.type === "TRAINING" && <TrainingCore3D />}
      </group>

      {/* 2. LA BASE HOLOGRÁFICA */}
      <group rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} ref={baseRef}>
        <mesh><circleGeometry args={[1.8, 32]} /><meshBasicMaterial color={baseColor} transparent opacity={0.03} depthWrite={false} /></mesh>
        <mesh><ringGeometry args={[1.78, 1.8, 64]} /><meshBasicMaterial color={baseColor} transparent opacity={0.4} depthWrite={false} /></mesh>
        <mesh><ringGeometry args={[1.4, 1.42, 32, 1, 0, Math.PI * 2]} /><meshBasicMaterial color={baseColor} transparent opacity={0.15} wireframe depthWrite={false} /></mesh>
        {[0, Math.PI/2, Math.PI, Math.PI*1.5].map((angle, i) => (
          <mesh key={i} rotation={[0, 0, angle]} position={[0, 0, 0.01]}>
            <planeGeometry args={[0.04, 0.2]} /><meshBasicMaterial color={baseColor} transparent opacity={0.6} depthWrite={false} />
          </mesh>
        ))}
      </group>

      {/* 3. LA UI DOM CON HTML DE DREI */}
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
          />
        </Html>
      ) : null}
    </group>
  );
}
