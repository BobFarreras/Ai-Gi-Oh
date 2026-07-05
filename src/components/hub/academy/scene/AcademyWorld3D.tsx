// src/components/hub/academy/scene/AcademyWorld3D.tsx
// Mundo 3D de Academy (espejo del patrón de HubSceneWorld3D): Canvas con perfil de render
// adaptativo, luces cian, suelo tenue y los 3 pilares holográficos (Tutorial · Arena · Docs).
// En desktop/tablet los 3 pilares están fijos en fila. En móvil se convierten en un CARRUSEL:
// 3 slots en profundidad (delante/medio/atrás), solo el de delante muestra título, y las flechas
// del HUD rotan qué nodo ocupa cada slot (los hologramas se deslizan pasando por el centro).
"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
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
const DOC_NODE_TEXTURE = "/assets/story/servidor-doc.webp";

type Vec3 = [number, number, number];

interface AcademyNodeConfig {
  key: string;
  textureUrl: string;
  title: string;
  route: string;
  hologramHeight?: number;
  baseY?: number;
  floatOffset: number;
  activationDelaySeconds: number;
}

// Orden del carrusel (el índice 0 arranca en el slot de delante). Arena empieza al frente.
const ACADEMY_NODES: AcademyNodeConfig[] = [
  {
    key: "arena",
    textureUrl: ARENA_TEXTURE,
    title: "Arena",
    route: ACADEMY_TRAINING_ARENA_ROUTE,
    baseY: 0.38,
    floatOffset: 1.1,
    activationDelaySeconds: 0.18,
  },
  {
    key: "tutorial",
    textureUrl: TUTORIAL_TEXTURE,
    title: "Tutorial",
    route: ACADEMY_TUTORIAL_MAP_ROUTE,
    hologramHeight: 4.1,
    floatOffset: 0,
    activationDelaySeconds: 0,
  },
  {
    key: "docs",
    textureUrl: DOC_NODE_TEXTURE,
    title: "Documentación",
    route: ACADEMY_GLOSSARY_ROUTE,
    hologramHeight: 3.4,
    floatOffset: 2.2,
    activationDelaySeconds: 0.36,
  },
];

/** Número de nodos del carrusel (compartido con el HUD que pinta las flechas). */
export const ACADEMY_CAROUSEL_NODE_COUNT = ACADEMY_NODES.length;

// Zoom cinematográfico al pulsar un holograma: la cámara se acerca hacia él y, al terminar, navega.
const ZOOM_LAMBDA = 3.5; // suavizado del acercamiento (mayor = más rápido)
const ZOOM_DISTANCE = 5.8; // unidades de mundo a las que queda la cámara del holograma
const ZOOM_DURATION_MS = 620; // espera antes de navegar (deja ver el acercamiento)

interface ZoomState {
  /** Posición final de la cámara (cerca del holograma). */
  targetPos: Vec3;
  /** Punto al que mira la cámara (centro del holograma). */
  center: Vec3;
}

// Slots del carrusel móvil en orden [delante, medio, atrás]. La cámara está elevada, así que más
// profundidad (z negativo) sube en pantalla y más adelante (z positivo) baja. Delante-abajo casi
// sobre el botón "Volver al Menú"; atrás-arriba pequeño para dejar ver su título.
const MOBILE_CAROUSEL_SLOTS: Vec3[] = [
  [0, 0, 3.2],
  [1.3, 0, -0.2],
  [-1.3, 0, -5.0],
];

interface AcademyWorld3DProps {
  viewportWidth: number;
  isDocumentVisible: boolean;
  /** Índice del nodo que está en el slot de delante (solo se usa en el carrusel móvil). */
  activeNodeIndex: number;
  onSelect: (route: string) => void;
  /** Trae un nodo del carrusel al frente (al tocar un holograma que no es el central). */
  onFocusNode: (index: number) => void;
  onHoverSound?: () => void;
}

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
 * Layout responsivo por breakpoint (cámara, FOV, escala y — en desktop/tablet — posiciones fijas).
 * - Desktop (≥900px): 3 pilares en fila (Tutorial izq · Arena centro-atrás · Docs der). SIN CAMBIOS.
 * - Tablet (<900px): misma fila pero más junta y cámara algo más lejos.
 * - Móvil (<640px, retrato): las posiciones se ignoran (el carrusel usa MOBILE_CAROUSEL_SLOTS); solo
 *   se aprovechan cámara/FOV/escala.
 */
function resolveAcademyLayout(viewportWidth: number): ResolvedLayout {
  if (viewportWidth < 640) {
    return {
      arenaPos: MOBILE_CAROUSEL_SLOTS[0],
      tutorialPos: MOBILE_CAROUSEL_SLOTS[1],
      docPos: MOBILE_CAROUSEL_SLOTS[2],
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
function AcademyCameraRig({ target, zoom }: { target: [number, number, number]; zoom: ZoomState | null }) {
  const camera = useThree((state) => state.camera);
  const zoomTargetVec = useMemo(() => (zoom ? new THREE.Vector3(...zoom.targetPos) : null), [zoom]);
  const zoomCenterVec = useMemo(() => (zoom ? new THREE.Vector3(...zoom.center) : null), [zoom]);
  useEffect(() => {
    // Fuera del zoom, la cámara mira al centro de la escena (se re-orienta al cambiar el layout).
    if (!zoom) camera.lookAt(new THREE.Vector3(...target));
  }, [camera, target, zoom]);
  useFrame((_, delta) => {
    if (!zoomTargetVec || !zoomCenterVec) return;
    // Acerca la cámara al holograma pulsado y la mantiene mirándolo (lerp/lookAt son métodos).
    camera.position.lerp(zoomTargetVec, 1 - Math.exp(-ZOOM_LAMBDA * delta));
    camera.lookAt(zoomCenterVec);
  });
  return null;
}

export function AcademyWorld3D({
  viewportWidth,
  isDocumentVisible,
  activeNodeIndex,
  onSelect,
  onFocusNode,
  onHoverSound,
}: AcademyWorld3DProps) {
  const capability = useHubDeviceCapability();
  const renderProfile = useMemo(
    () => resolveHubRenderProfile(viewportWidth, capability),
    [capability, viewportWidth],
  );
  const layout = useMemo(() => resolveAcademyLayout(viewportWidth), [viewportWidth]);
  const isMobile = viewportWidth < 640;
  // Modo ligero: móvil o dispositivo limitado / reduce-motion. Recorta el coste por frame más caro
  // (suelo iluminado, luces puntuales por pilar y la baraja HTML de Documentación) sin tocar el
  // diseño en desktop de gama alta.
  const isLite = useMemo(
    () => isMobile || capability.isConstrainedDevice || capability.prefersReducedMotion,
    [capability.isConstrainedDevice, capability.prefersReducedMotion, isMobile],
  );

  // Zoom al pulsar un holograma: acerca la cámara hacia él y navega al terminar.
  const [zoom, setZoom] = useState<ZoomState | null>(null);
  const navTimerRef = useRef<number | null>(null);
  useEffect(() => () => {
    if (navTimerRef.current !== null) window.clearTimeout(navTimerRef.current);
  }, []);

  const handleNavigate = (route: string, pos: Vec3, centerY: number): void => {
    if (zoom) return; // ya hay un zoom en curso: ignora nuevos clicks
    // Accesibilidad + gama baja: si el usuario pide menos movimiento, navega directo sin animar cámara.
    if (capability.prefersReducedMotion) {
      onSelect(route);
      return;
    }
    const center = new THREE.Vector3(pos[0], centerY, pos[2]);
    // Dirección desde el holograma hacia la cámara actual; la cámara termina a ZOOM_DISTANCE de él.
    const dir = new THREE.Vector3(...layout.cameraPosition).sub(center).normalize();
    const targetPos = center.clone().add(dir.multiplyScalar(ZOOM_DISTANCE));
    setZoom({
      targetPos: [targetPos.x, targetPos.y + 0.3, targetPos.z],
      center: [center.x, center.y, center.z],
    });
    navTimerRef.current = window.setTimeout(() => onSelect(route), ZOOM_DURATION_MS);
  };

  return (
    <Canvas
      dpr={renderProfile.dpr}
      gl={{ antialias: false, powerPreference: "high-performance" }}
      frameloop={isDocumentVisible ? "always" : "never"}
    >
      <PerspectiveCamera makeDefault position={layout.cameraPosition} fov={layout.fov} />
      <AcademyCameraRig target={layout.lookAtTarget} zoom={zoom} />
      <ambientLight intensity={0.35} />
      <directionalLight position={[8, 16, 10]} intensity={1.1} color="#0ea5e9" />
      <directionalLight position={[-12, 8, -10]} intensity={0.5} color="#38bdf8" />

      {/* Suelo tenue con rejilla cian (barato, sin reflejo en tiempo real). En modo ligero usa
          material sin iluminar: elimina el cálculo de luces sobre el plano grande (el fragment más
          caro por frame en gama baja). */}
      <group position={[0, 0, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[80, 80]} />
          {isLite ? (
            <meshBasicMaterial color="#04141f" />
          ) : (
            <meshStandardMaterial color="#03111c" roughness={0.9} metalness={0.1} />
          )}
        </mesh>
        <gridHelper args={[80, renderProfile.gridDivisions, "#0e7490", "#0b3a4a"]} position={[0, 0.01, 0]} />
      </group>

      <Suspense fallback={null}>
        {isMobile
          ? // --- Carrusel móvil: cada nodo se coloca en el slot según su distancia al activo y se
            // desliza al rotar. El título NO va en 3D (lo pinta la barra fija del HUD, que no se
            // mueve): solo pasan los hologramas. El nodo de delante navega al tocarlo; tocar otro lo
            // trae al frente. El renderOrder (= z del slot) da el z-index de profundidad: central
            // máximo, luego medio, luego el del fondo.
            ACADEMY_NODES.map((node, index) => {
              const slotIndex =
                (index - activeNodeIndex + ACADEMY_CAROUSEL_NODE_COUNT) % ACADEMY_CAROUSEL_NODE_COUNT;
              const slot = MOBILE_CAROUSEL_SLOTS[slotIndex];
              const isFront = slotIndex === 0;
              // Altura del centro del holograma en mundo (para apuntar el zoom).
              const centerY = ((node.baseY ?? 0) + (node.hologramHeight ?? 3.6) / 2) * layout.pillarScale;
              return (
                <HologramPillar
                  key={node.key}
                  textureUrl={node.textureUrl}
                  position={slot}
                  hologramHeight={node.hologramHeight}
                  baseY={node.baseY}
                  chromaKeyWhite={node.key === "docs"}
                  scale={layout.pillarScale}
                  renderOrder={slot[2]}
                  animatePosition={!capability.prefersReducedMotion}
                  onSelect={isFront ? () => handleNavigate(node.route, slot, centerY) : () => onFocusNode(index)}
                  onHoverSound={onHoverSound}
                  activationDelaySeconds={node.activationDelaySeconds}
                  floatOffset={node.floatOffset}
                  lite
                />
              );
            })
          : // --- Desktop/tablet: 3 pilares fijos en fila (sin cambios de diseño).
            [
              { node: ACADEMY_NODES[1], pos: layout.tutorialPos }, // Tutorial (izquierda)
              { node: ACADEMY_NODES[0], pos: layout.arenaPos }, // Arena (centro-atrás)
              { node: ACADEMY_NODES[2], pos: layout.docPos }, // Documentación (derecha)
            ].map(({ node, pos }) => (
              <HologramPillar
                key={node.key}
                textureUrl={node.textureUrl}
                position={pos}
                title={node.title}
                hologramHeight={node.hologramHeight}
                baseY={node.baseY}
                chromaKeyWhite={node.key === "docs"}
                scale={layout.pillarScale}
                renderOrder={pos[2]}
                onSelect={() =>
                  handleNavigate(
                    node.route,
                    pos,
                    ((node.baseY ?? 0) + (node.hologramHeight ?? 3.6) / 2) * layout.pillarScale,
                  )
                }
                onHoverSound={onHoverSound}
                activationDelaySeconds={node.activationDelaySeconds}
                floatOffset={node.floatOffset}
                lite={isLite}
              />
            ))}
      </Suspense>
    </Canvas>
  );
}
