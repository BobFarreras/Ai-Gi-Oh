// src/components/hub/HubScene.tsx - Escena principal del hub con HUD 2D superpuesto y mapa 3D interactivo.
"use client";

import { useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, MeshReflectorMaterial } from "@react-three/drei";
import { IHubMapNode } from "@/core/entities/hub/IHubMapNode";
import { HubSectionType, IHubSection } from "@/core/entities/hub/IHubSection";
import { IPlayerHubProgress } from "@/core/entities/hub/IPlayerHubProgress";

// HUD UI Components
import { HubProgressSection } from "@/components/hub/HubProgressSection";
import { HubSessionSection } from "@/components/hub/HubSessionSection";
import { HubUserSection } from "@/components/hub/HubUserSection";

// Nodos 3D
import { HubSceneNode3D } from "@/components/hub/HubSceneNode3D";

interface HubSceneProps {
  playerLabel?: string;
  progress?: IPlayerHubProgress;
  showMetaNodes?: boolean;
  sections: IHubSection[];
  nodes: IHubMapNode[];
}

export function HubScene({ playerLabel, progress, showMetaNodes = false, sections, nodes }: HubSceneProps) {
  const sectionsByType = useMemo(() => {
    return new Map<HubSectionType, IHubSection>(sections.map((section) => [section.type, section]));
  }, [sections]);

  return (
    <section className="relative h-screen w-full overflow-hidden">

      {/* =========================================
          1. CAPA DEL HUD (Interfaces 2D)
          ========================================= */}
      <div className="pointer-events-none absolute inset-0 z-40">
        {showMetaNodes && playerLabel && (
          <div className="pointer-events-auto absolute left-4 top-4 sm:left-[6%] sm:top-[6%]">
            <HubUserSection playerLabel={playerLabel} />
          </div>
        )}
        {showMetaNodes && progress && (
          <div className="pointer-events-auto absolute left-1/2 top-5 sm:top-3 -translate-x-1/2">
            <HubProgressSection progress={progress} />
          </div>
        )}
        {showMetaNodes && (
          <div className="pointer-events-auto absolute right-4 top-4 sm:right-[6%] sm:top-[6%]">
            <HubSessionSection />
          </div>
        )}
      </div>

      {/* =========================================
          2. CAPA DEL MUNDO 3D (Tactical Dark Room)
          ========================================= */}
      <div className="absolute inset-0 z-10 bg-[#010610]">
        {/* Fondo base ultra oscuro para que no haya fugas de luz clara */}
        <Canvas
          camera={{ position: [0, 15, 22], fov: 45 }}
          dpr={[1, 1.5]}
          gl={{ antialias: false, powerPreference: "high-performance" }}
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
              <planeGeometry args={[150, 150]} />
              <MeshReflectorMaterial
                blur={[400, 100]}      // Difuminado direccional elegante
                resolution={1024}      // Alta resolución para los hologramas
                mixBlur={1}
                mixStrength={40}       // 🚀 MUY FUERTE: Para que los colores de los neones se reflejen brutalmente
                roughness={0.15}       // Muy liso (casi cristal)
                depthScale={1.2}
                minDepthThreshold={0.4}
                maxDepthThreshold={1.4}
                color="#020813"        // Color casi negro, azul abisal
                metalness={0.8}        // Muy metálico para potenciar el reflejo
                mirror={0}
              />
            </mesh>

            {/* Retícula Táctica (Grid Tron) */}
            <gridHelper
              args={[150, 150, '#0284c7', '#082f49']}
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
          {nodes.map((node) => {
            const section = sectionsByType.get(node.sectionType);
            if (!section) return null;
            return <HubSceneNode3D key={node.id} node={node} section={section} />;
          })}
        </Canvas>
      </div>
    </section>
  );
}
