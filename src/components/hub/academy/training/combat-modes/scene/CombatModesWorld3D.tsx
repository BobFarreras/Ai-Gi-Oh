// src/components/hub/academy/training/combat-modes/scene/CombatModesWorld3D.tsx
// Mundo 3D del portal de modos (espejo de AcademyWorld3D): cada modo tiene su escenografía procedural
// —anfiteatro, puesto avanzado y pórtico— con el rival proyectado encima como holograma.
"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";
import { resolveHubRenderProfile } from "@/components/hub/internal/hub-render-profile";
import { useHubDeviceCapability } from "@/components/hub/internal/use-hub-device-capability";
import { HologramPillar } from "@/components/hub/academy/scene/HologramPillar";
import { ModePedestal } from "./internal/ModePedestal";
import {
  COMBAT_MODE_SCENE_NODES,
  Vec3,
  resolveCarouselPosition,
  resolveCombatModesLayout,
} from "./internal/combat-modes-scene-config";

const ZOOM_LAMBDA = 3.5;
const ZOOM_DISTANCE = 5.8;
const ZOOM_DURATION_MS = 620;

interface ZoomState {
  targetPos: Vec3;
  center: Vec3;
}

interface ICombatModesWorld3DProps {
  viewportWidth: number;
  isDocumentVisible: boolean;
  activeNodeIndex: number;
  onSelect: (route: string) => void;
  onFocusNode: (index: number) => void;
  onHoverSound?: () => void;
}

function CombatModesCameraRig({ target, zoom }: { target: Vec3; zoom: ZoomState | null }) {
  const camera = useThree((state) => state.camera);
  const zoomTargetVec = useMemo(() => (zoom ? new THREE.Vector3(...zoom.targetPos) : null), [zoom]);
  const zoomCenterVec = useMemo(() => (zoom ? new THREE.Vector3(...zoom.center) : null), [zoom]);
  const lookAtRef = useRef(new THREE.Vector3(...target));

  useEffect(() => {
    if (zoom) return;
    lookAtRef.current.set(target[0], target[1], target[2]);
    camera.lookAt(lookAtRef.current);
  }, [camera, target, zoom]);

  useFrame((_, delta) => {
    if (!zoomTargetVec || !zoomCenterVec) return;
    const t = 1 - Math.exp(-ZOOM_LAMBDA * delta);
    camera.position.lerp(zoomTargetVec, t);
    lookAtRef.current.lerp(zoomCenterVec, t);
    camera.lookAt(lookAtRef.current);
  });
  return null;
}

export function CombatModesWorld3D(props: ICombatModesWorld3DProps) {
  const capability = useHubDeviceCapability();
  const renderProfile = useMemo(
    () => resolveHubRenderProfile(props.viewportWidth, capability),
    [capability, props.viewportWidth],
  );
  const layout = useMemo(() => resolveCombatModesLayout(props.viewportWidth), [props.viewportWidth]);
  const isMobile = props.viewportWidth < 640;
  const isLite = useMemo(
    () => isMobile || capability.isConstrainedDevice || capability.prefersReducedMotion,
    [capability.isConstrainedDevice, capability.prefersReducedMotion, isMobile],
  );

  const [zoom, setZoom] = useState<ZoomState | null>(null);
  const navTimerRef = useRef<number | null>(null);
  useEffect(() => () => {
    if (navTimerRef.current !== null) window.clearTimeout(navTimerRef.current);
  }, []);

  const handleNavigate = (route: string, pos: Vec3, centerY: number): void => {
    if (zoom) return;
    // Quien pide menos movimiento navega directo: la cámara no se le mueve encima.
    if (capability.prefersReducedMotion) return props.onSelect(route);
    const center = new THREE.Vector3(pos[0], centerY, pos[2]);
    const dir = new THREE.Vector3(...layout.cameraPosition).sub(center).normalize();
    const targetPos = center.clone().add(dir.multiplyScalar(ZOOM_DISTANCE));
    setZoom({ targetPos: [targetPos.x, targetPos.y + 0.3, targetPos.z], center: [center.x, center.y, center.z] });
    navTimerRef.current = window.setTimeout(() => props.onSelect(route), ZOOM_DURATION_MS);
  };

  const total = COMBAT_MODE_SCENE_NODES.length;
  const positionFor = (index: number): Vec3 =>
    isMobile ? resolveCarouselPosition(index, props.activeNodeIndex, total) : layout.positions[index];

  return (
    <Canvas
      dpr={renderProfile.dpr}
      gl={{ antialias: false, powerPreference: "high-performance" }}
      frameloop={props.isDocumentVisible ? "always" : "never"}
    >
      <PerspectiveCamera makeDefault position={layout.cameraPosition} fov={layout.fov} />
      <CombatModesCameraRig target={layout.lookAtTarget} zoom={zoom} />
      <ambientLight intensity={0.32} />
      <directionalLight position={[8, 16, 10]} intensity={1.0} color="#38bdf8" />
      <directionalLight position={[-12, 8, -10]} intensity={0.45} color="#a855f7" />

      <group>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[90, 90]} />
          {isLite ? <meshBasicMaterial color="#050a14" /> : <meshStandardMaterial color="#04081199" roughness={0.9} metalness={0.1} />}
        </mesh>
        <gridHelper args={[90, renderProfile.gridDivisions, "#1e3a5f", "#101f33"]} position={[0, 0.005, 0]} />
      </group>

      <Suspense fallback={null}>
        {COMBAT_MODE_SCENE_NODES.map((node, index) => {
          const pos = positionFor(index);
          const isFront = !isMobile || index === props.activeNodeIndex;
          const centerY = (node.hologramHeight / 2 + 0.4) * layout.pillarScale;
          return (
            <group key={node.key}>
              {/* En móvil el pedestal se apaga: el presupuesto va a que el carrusel vaya fluido. */}
              {layout.showScenery ? (
                <ModePedestal position={pos} accentColor={node.accentColor} scale={layout.pillarScale} lite={isLite} />
              ) : null}
              <HologramPillar
                textureUrl={node.textureUrl}
                position={[pos[0], pos[1] + 0.4, pos[2]]}
                title={isMobile ? undefined : node.title}
                hologramHeight={node.hologramHeight}
                scale={layout.pillarScale}
                renderOrder={pos[2]}
                animatePosition={isMobile && !capability.prefersReducedMotion}
                chromaKeyWhite
                chromaKeyThreshold={node.chromaKeyThreshold}
                onSelect={isFront
                  ? () => handleNavigate(node.route, pos, centerY)
                  : () => props.onFocusNode(index)}
                onHoverSound={props.onHoverSound}
                activationDelaySeconds={node.activationDelaySeconds}
                floatOffset={node.floatOffset}
                lite={isLite}
              />
            </group>
          );
        })}
      </Suspense>
    </Canvas>
  );
}
