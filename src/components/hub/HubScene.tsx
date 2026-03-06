// src/components/hub/HubScene.tsx - Escena principal del hub con HUD 2D superpuesto y mapa 3D interactivo.
"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, MeshReflectorMaterial } from "@react-three/drei";
import { IHubMapNode } from "@/core/entities/hub/IHubMapNode";
import { HubSectionType, IHubSection } from "@/core/entities/hub/IHubSection";
import { IPlayerHubProgress } from "@/core/entities/hub/IPlayerHubProgress";
import { HubSceneNode3D } from "@/components/hub/HubSceneNode3D";
import { HubSceneHudOverlay } from "@/components/hub/HubSceneHudOverlay";
import { HubSceneFallback2D } from "@/components/hub/HubSceneFallback2D";
import { HUB_NODE_STAGGER_DELAY } from "@/components/hub/internal/hub-entry-timings";
import { applyResponsiveNodeLayout } from "@/components/hub/internal/hub-node-responsive-layout";
import { HUB_SCENE_FLOOR_CONFIG } from "@/components/hub/internal/hub-scene-floor-config";
import { supportsWebGL } from "@/components/hub/internal/hub-webgl-support";
import { useDocumentVisibility } from "@/components/hub/internal/use-document-visibility";
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
  const canRender3D = useMemo(
    () => (forceFallbackForTests ? false : supportsWebGL()),
    [forceFallbackForTests],
  );
  const responsiveNodes = useMemo(() => applyResponsiveNodeLayout(nodes, viewportWidth), [nodes, viewportWidth]);

  const sectionsByType = useMemo(() => {
    return new Map<HubSectionType, IHubSection>(sections.map((section) => [section.type, section]));
  }, [sections]);

  return (
    <section className="relative h-screen w-full overflow-hidden">
      <HubSceneHudOverlay playerLabel={playerLabel} progress={progress} showMetaNodes={showMetaNodes} />

      {/* =========================================
          2. CAPA DEL MUNDO 3D (Tactical Dark Room)
          ========================================= */}
      <div className="absolute inset-0 z-10 bg-[#010610]">
        {!canRender3D ? <HubSceneFallback2D sections={sections} nodes={responsiveNodes} onNavigate={(href) => router.push(href)} /> : null}
        {/* Fondo base ultra oscuro para que no haya fugas de luz clara */}
        {canRender3D ? (
          <Canvas
          camera={{ position: [0, 15, 22], fov: 45 }}
          dpr={[1, 1.5]}
          gl={{ antialias: false, powerPreference: "high-performance" }}
          frameloop={isDocumentVisible ? "always" : "never"}
          className="cursor-grab active:cursor-grabbing"
        >
          {/* 💡 ILUMINACIÓN CIBERPUNK (Dramática pero visible) */}
          {/* Luz ambiental baja para mantener el contraste y que los neones brillen */}
          <ambientLight intensity={0.3} />

          {/* Foco de luz principal azulado tenue (Baño táctico) */}
          <directionalLight
            position={[10, 20, 10]}
            intensity={1.2}
            color="#0ea5e9"
          />
          {/* Luz de relleno fría en el lado opuesto para que los polígonos no se vuelvan 100% negros */}
          <directionalLight
            position={[-15, 10, -15]}
            intensity={0.5}
            color="#38bdf8"
          />

          {/* 🚀 EL SUELO (Cristal de Obsidiana Pulido) */}
          <group position={[0, -0.05, 0]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[HUB_SCENE_FLOOR_CONFIG.planeSize, HUB_SCENE_FLOOR_CONFIG.planeSize]} />
              <MeshReflectorMaterial
                blur={HUB_SCENE_FLOOR_CONFIG.blur}
                resolution={HUB_SCENE_FLOOR_CONFIG.reflectionResolution}
                mixBlur={1}
                mixStrength={HUB_SCENE_FLOOR_CONFIG.reflectionStrength}
                roughness={HUB_SCENE_FLOOR_CONFIG.roughness}
                depthScale={1.2}
                minDepthThreshold={0.4}
                maxDepthThreshold={1.4}
                color={HUB_SCENE_FLOOR_CONFIG.planeColor}
                metalness={HUB_SCENE_FLOOR_CONFIG.metalness}
                mirror={0}
              />
            </mesh>

            {/* Retícula Táctica (Grid Tron) */}
            <gridHelper
              args={[
                HUB_SCENE_FLOOR_CONFIG.gridSize,
                HUB_SCENE_FLOOR_CONFIG.gridDivisions,
                HUB_SCENE_FLOOR_CONFIG.gridPrimaryColor,
                HUB_SCENE_FLOOR_CONFIG.gridSecondaryColor,
              ]}
              position={[0, 0.01, 0]}
            />
          </group>

          {/* Controles del mapa */}
          <OrbitControls
            enableDamping
            dampingFactor={0.08}
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            maxPolarAngle={Math.PI / 2.1}
            minPolarAngle={0}
            maxDistance={40}
            minDistance={10}
          />

          {/* Nodos 3D */}
          {responsiveNodes.map((node, index) => {
            const section = sectionsByType.get(node.sectionType);
            if (!section) return null;
            const nodeDelay = index * HUB_NODE_STAGGER_DELAY;
            return <HubSceneNode3D key={node.id} node={node} section={section} nodeEntryDelay={nodeDelay} />;
          })}
        </Canvas>
      ) : null}
      </div>
    </section>
  );
}
