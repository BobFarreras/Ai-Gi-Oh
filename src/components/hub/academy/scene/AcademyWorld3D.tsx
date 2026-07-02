// src/components/hub/academy/scene/AcademyWorld3D.tsx
// Mundo 3D de Academy (espejo del patrón de HubSceneWorld3D): Canvas con perfil de render
// adaptativo, luces cian, suelo tenue y los 3 pilares holográficos (Tutorial · Arena · Docs).
"use client";

import { Suspense, useEffect, useMemo } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";
import { resolveHubRenderProfile } from "@/components/hub/internal/hub-render-profile";
import { useHubDeviceCapability } from "@/components/hub/internal/use-hub-device-capability";
import {
  ACADEMY_GLOSSARY_ROUTE,
  ACADEMY_TRAINING_ARENA_ROUTE,
  ACADEMY_TUTORIAL_MAP_ROUTE,
} from "@/core/constants/routes/academy-routes";
import { HologramPillar } from "./HologramPillar";

const TUTORIAL_TEXTURE = "/assets/story/opponents/opp-ch1-biglog/intro-BigLog.webp";
const ARENA_TEXTURE = "/assets/story/opponents/opp-ch1-guill/intro-Guill.webp";
const DOC_CARD_TEXTURE = "/assets/readme/card-render-showcase.webp";

interface AcademyWorld3DProps {
  viewportWidth: number;
  isDocumentVisible: boolean;
  onSelect: (route: string) => void;
  onHoverSound?: () => void;
}

type Vec3 = [number, number, number];

interface ResolvedLayout {
  tutorialPos: Vec3;
  arenaPos: Vec3;
  docPos: Vec3;
  cameraPosition: Vec3;
  lookAtTarget: Vec3;
  fov: number;
  /** Escala de los pilares (en móvil se achican para que quepan los 3). */
  pillarScale: number;
}

/**
 * Layout responsivo por breakpoint.
 * - Desktop (≥900px): 3 pilares en fila (Tutorial izq · Arena centro-atrás · Docs der). SIN CAMBIOS.
 * - Tablet (<900px): misma fila pero más junta y cámara algo más lejos.
 * - Móvil (<640px, retrato): columna ESCALONADA en profundidad para aprovechar el alto — Tutorial
 *   delante-abajo (centro), Arena encima a la derecha (más atrás), Docs detrás a la izquierda. La
 *   cámara mira desde delante y elevada, así la profundidad se traduce en altura en pantalla.
 */
function resolveAcademyLayout(viewportWidth: number): ResolvedLayout {
  if (viewportWidth < 640) {
    // Móvil (retrato): columna escalonada en profundidad + pilares achicados para que quepan enteros.
    return {
      tutorialPos: [0, 0, 1.5],
      arenaPos: [2.0, 0, -1.6],
      docPos: [-2.0, 0, -3.9],
      cameraPosition: [0, 3.9, 11],
      lookAtTarget: [0, 0.9, -1.4],
      fov: 50,
      pillarScale: 0.7,
    };
  }
  if (viewportWidth < 900) {
    return {
      tutorialPos: [-3.2, 0, 0],
      arenaPos: [0, 0, -1.5],
      docPos: [3.2, 0, 0],
      cameraPosition: [0, 2.7, 12.6],
      lookAtTarget: [0, 1.45, 0],
      fov: 52,
      pillarScale: 1,
    };
  }
  return {
    tutorialPos: [-4.2, 0, 0],
    arenaPos: [0, 0, -1.9],
    docPos: [4.2, 0, 0],
    cameraPosition: [0, 2.6, 11.2],
    lookAtTarget: [0, 1.5, 0],
    fov: 45,
    pillarScale: 1,
  };
}

// La posición y el FOV los fija <PerspectiveCamera> de drei (declarativo, se actualiza al cambiar el
// layout). El rig solo orienta la cámara al centro (lookAt es un método, permitido por el linter).
function AcademyCameraRig({ target }: { target: [number, number, number] }) {
  const camera = useThree((state) => state.camera);
  useEffect(() => {
    camera.lookAt(new THREE.Vector3(...target));
  }, [camera, target]);
  return null;
}

export function AcademyWorld3D({
  viewportWidth,
  isDocumentVisible,
  onSelect,
  onHoverSound,
}: AcademyWorld3DProps) {
  const capability = useHubDeviceCapability();
  const renderProfile = useMemo(
    () => resolveHubRenderProfile(viewportWidth, capability),
    [capability, viewportWidth],
  );
  const layout = useMemo(() => resolveAcademyLayout(viewportWidth), [viewportWidth]);

  return (
    <Canvas
      dpr={renderProfile.dpr}
      gl={{ antialias: false, powerPreference: "high-performance" }}
      frameloop={isDocumentVisible ? "always" : "never"}
    >
      <PerspectiveCamera makeDefault position={layout.cameraPosition} fov={layout.fov} />
      <AcademyCameraRig target={layout.lookAtTarget} />
      <ambientLight intensity={0.35} />
      <directionalLight position={[8, 16, 10]} intensity={1.1} color="#0ea5e9" />
      <directionalLight position={[-12, 8, -10]} intensity={0.5} color="#38bdf8" />

      {/* Suelo tenue con rejilla cian (barato, sin reflejo en tiempo real). */}
      <group position={[0, 0, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[80, 80]} />
          <meshStandardMaterial color="#03111c" roughness={0.9} metalness={0.1} />
        </mesh>
        <gridHelper args={[80, renderProfile.gridDivisions, "#0e7490", "#0b3a4a"]} position={[0, 0.01, 0]} />
      </group>

      <Suspense fallback={null}>
        {/* Tutorial (desktop: izquierda · móvil: delante-abajo) */}
        <HologramPillar
          textureUrl={TUTORIAL_TEXTURE}
          position={layout.tutorialPos}
          title="Tutorial"
          hologramHeight={4.1}
          scale={layout.pillarScale}
          renderOrder={layout.tutorialPos[2]}
          onSelect={() => onSelect(ACADEMY_TUTORIAL_MAP_ROUTE)}
          onHoverSound={onHoverSound}
          activationDelaySeconds={0}
          floatOffset={0}
        />
        {/* Arena (desktop: centro-atrás · móvil: encima a la derecha). baseY sube al oponente
            (su imagen no tiene margen inferior y se le cortaban los pies). */}
        <HologramPillar
          textureUrl={ARENA_TEXTURE}
          position={layout.arenaPos}
          title="Arena"
          baseY={0.38}
          scale={layout.pillarScale}
          renderOrder={layout.arenaPos[2]}
          onSelect={() => onSelect(ACADEMY_TRAINING_ARENA_ROUTE)}
          onHoverSound={onHoverSound}
          activationDelaySeconds={0.18}
          floatOffset={1.1}
        />
        {/* Documentación/Códex (desktop: derecha · móvil: detrás a la izquierda), baraja holográfica */}
        <HologramPillar
          textureUrl={DOC_CARD_TEXTURE}
          position={layout.docPos}
          title="Documentación"
          hologramHeight={3.4}
          documentationDeck
          scale={layout.pillarScale}
          renderOrder={layout.docPos[2]}
          onSelect={() => onSelect(ACADEMY_GLOSSARY_ROUTE)}
          onHoverSound={onHoverSound}
          activationDelaySeconds={0.36}
          floatOffset={2.2}
        />
      </Suspense>
    </Canvas>
  );
}
