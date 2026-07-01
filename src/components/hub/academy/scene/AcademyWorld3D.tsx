// src/components/hub/academy/scene/AcademyWorld3D.tsx
// Mundo 3D de Academy (espejo del patrón de HubSceneWorld3D): Canvas con perfil de render
// adaptativo, luces cian, suelo tenue y los 3 pilares holográficos (Tutorial · Arena · Docs).
"use client";

import { Suspense, useEffect, useMemo } from "react";
import { Canvas, useThree } from "@react-three/fiber";
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

interface ResolvedLayout {
  spacingX: number;
  arenaBackZ: number;
  cameraPosition: [number, number, number];
  lookAtTarget: [number, number, number];
}

/** Layout responsivo: en pantallas estrechas separa menos los pilares y aleja la cámara. */
function resolveAcademyLayout(viewportWidth: number): ResolvedLayout {
  const isNarrow = viewportWidth < 900;
  if (isNarrow) {
    return {
      spacingX: 3.1,
      arenaBackZ: -1.4,
      cameraPosition: [0, 2.9, 14.5],
      lookAtTarget: [0, 1.5, 0],
    };
  }
  return {
    spacingX: 4.2,
    arenaBackZ: -1.9,
    cameraPosition: [0, 2.6, 11.2],
    lookAtTarget: [0, 1.5, 0],
  };
}

/** Coloca y orienta la cámara según el layout (se re-aplica al cambiar el viewport). */
function AcademyCameraRig({ layout }: { layout: ResolvedLayout }) {
  const camera = useThree((state) => state.camera);
  useEffect(() => {
    camera.position.set(...layout.cameraPosition);
    camera.lookAt(new THREE.Vector3(...layout.lookAtTarget));
  }, [camera, layout]);
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
      camera={{ position: layout.cameraPosition, fov: 45 }}
      dpr={renderProfile.dpr}
      gl={{ antialias: false, powerPreference: "high-performance" }}
      frameloop={isDocumentVisible ? "always" : "never"}
    >
      <AcademyCameraRig layout={layout} />
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
        {/* Tutorial · izquierda */}
        <HologramPillar
          textureUrl={TUTORIAL_TEXTURE}
          position={[-layout.spacingX, 0, 0]}
          title="Tutorial"
          hologramHeight={4.1}
          onSelect={() => onSelect(ACADEMY_TUTORIAL_MAP_ROUTE)}
          onHoverSound={onHoverSound}
          activationDelaySeconds={0}
          floatOffset={0}
        />
        {/* Arena · centro, desplazado hacia atrás para dar profundidad 3D. baseY sube al oponente
            (su imagen no tiene margen inferior y se le cortaban los pies). */}
        <HologramPillar
          textureUrl={ARENA_TEXTURE}
          position={[0, 0, layout.arenaBackZ]}
          title="Arena"
          baseY={0.38}
          onSelect={() => onSelect(ACADEMY_TRAINING_ARENA_ROUTE)}
          onHoverSound={onHoverSound}
          activationDelaySeconds={0.18}
          floatOffset={1.1}
        />
        {/* Documentación (Códex) · derecha, como baraja de cartas holográficas */}
        <HologramPillar
          textureUrl={DOC_CARD_TEXTURE}
          position={[layout.spacingX, 0, 0]}
          title="Documentación"
          hologramHeight={3.4}
          documentationDeck
          onSelect={() => onSelect(ACADEMY_GLOSSARY_ROUTE)}
          onHoverSound={onHoverSound}
          activationDelaySeconds={0.36}
          floatOffset={2.2}
        />
      </Suspense>
    </Canvas>
  );
}
