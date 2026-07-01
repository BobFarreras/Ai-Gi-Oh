// src/components/hub/academy/scene/HologramPillar.tsx
// Pilar holográfico de Academy: pedestal emisivo + plano con la imagen proyectada con look
// holográfico (flotación, líneas de escaneo, cono de proyección) y estados hover/selección.
// El onClick delega la navegación (soft-nav) al padre. Reutilizable para los 3 pilares.
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { Html, useTexture } from "@react-three/drei";
import * as THREE from "three";
// Import de efecto secundario: ejecuta `extend(...)` para registrar <academyHologramMaterial />.
// (Debe ser un import real, no type-only: un `import { type ... }` se elimina en compilación
// y el `extend` nunca correría → "not part of the THREE namespace".)
import "./internal/academy-hologram-material";
import type { AcademyHologramMaterialImpl } from "./internal/academy-hologram-material";
import { DocumentationDeck } from "./DocumentationDeck";

interface HologramPillarProps {
  /** URL de la imagen a proyectar (webp intro del personaje/carta). */
  textureUrl: string;
  /** Posición del pilar en el mundo (base del pedestal en y=0). */
  position?: [number, number, number];
  /** Altura del plano holográfico en unidades de mundo; el ancho se deriva del aspect real. */
  hologramHeight?: number;
  /** Callback de selección (navegación soft-nav). */
  onSelect: () => void;
  /** Sonido opcional al entrar el puntero. */
  onHoverSound?: () => void;
  /** Desfase de flotación para escalonar varios pilares. */
  floatOffset?: number;
  /** Retardo (s) antes de que este pilar arranque su animación de aparición (entrada escalonada). */
  activationDelaySeconds?: number;
  /** Título futurista mostrado en la plataforma (Tutorial, Arena, Documentación). */
  title?: string;
  /** Altura de la base (pies) de la imagen; override por pilar (p. ej. subir uno con los pies cortados). */
  baseY?: number;
  /** Si true, renderiza la baraja de cartas reales (pilar de Documentación) en vez de una figura. */
  documentationDeck?: boolean;
}

const PEDESTAL_HEIGHT = 0.28;
// La base (pies) de la imagen queda centrada dentro del aro (que está a y≈0.28), como si
// el personaje emergiera del propio anillo.
const HOLOGRAM_BASE_Y = 0;
// Duración de la animación de "activación" del holograma al aparecer (escala + parpadeo).
// Ralentizada para que la aparición sea más pausada y acompañe al SFX de terminal.
const ACTIVATION_GROW_SECONDS = 1.5;
const ACTIVATION_SETTLE_SECONDS = 2.8;
const HOLOGRAM_STEADY_OPACITY = 0.95;
const SHAFT_STEADY_OPACITY = 0.55;

/** smoothstep escalar (idéntico al de GLSL) para generar los degradados de luz. */
function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

// Textura del HAZ DE LUZ (no un cilindro físico): degradado 2D suave — brillante y ancho abajo
// junto al pedestal, difuminado en los bordes laterales y apagándose hacia arriba (la luz se
// pierde con la altura). Aplicada como alphaMap sobre un plano aditivo, lee como luz, no geometría.
const LIGHT_SHAFT_TEXTURE = (() => {
  const width = 48;
  const height = 96;
  const data = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y += 1) {
    const t = y / (height - 1); // 0 abajo → 1 arriba
    // Se apaga hacia arriba y arranca justo sobre el pedestal.
    const vertical = (1 - smoothstep(0.3, 0.98, t)) * smoothstep(0, 0.04, t);
    for (let x = 0; x < width; x += 1) {
      const u = x / (width - 1);
      // Campana horizontal: brillante en el centro, se desvanece en los bordes (sin borde duro).
      const bell = Math.sin(u * Math.PI);
      const horizontal = bell * bell;
      const alpha = Math.max(0, vertical * horizontal);
      const value = Math.round(alpha * 255);
      const idx = (y * width + x) * 4;
      // IMPORTANTE: meshBasicMaterial.alphaMap lee el canal VERDE (no el alfa). El degradado
      // debe ir en RGB, no en el canal alfa, o el plano se ve como un rectángulo opaco.
      data[idx + 0] = value;
      data[idx + 1] = value;
      data[idx + 2] = value;
      data[idx + 3] = 255;
    }
  }
  const texture = new THREE.DataTexture(data, width, height, THREE.RGBAFormat);
  texture.needsUpdate = true;
  return texture;
})();

export function HologramPillar({
  textureUrl,
  position = [0, 0, 0],
  hologramHeight = 3.6,
  onSelect,
  onHoverSound,
  floatOffset = 0,
  activationDelaySeconds = 0,
  title,
  baseY = HOLOGRAM_BASE_Y,
  documentationDeck = false,
}: HologramPillarProps) {
  // El colorSpace se fija en el callback de carga (no se puede mutar el valor devuelto por el hook).
  const texture = useTexture(textureUrl, (loaded) => {
    const tex = Array.isArray(loaded) ? loaded[0] : loaded;
    if (tex) tex.colorSpace = THREE.SRGBColorSpace;
  });
  const holoGroupRef = useRef<THREE.Group>(null);
  const materialRef = useRef<AcademyHologramMaterialImpl | null>(null);
  const shaftMaterialRef = useRef<THREE.MeshBasicMaterial>(null);
  const timeRef = useRef(0);
  const [isHovered, setIsHovered] = useState(false);

  // Deriva el ancho del plano del aspect real de la imagen (useTexture suspende hasta cargar,
  // así que texture.image ya existe aquí) — evita estirar la silueta.
  const hologramWidth = useMemo(() => {
    const image = texture.image as { width?: number; height?: number } | undefined;
    const aspect = image?.width && image?.height ? image.width / image.height : 0.72;
    return hologramHeight * aspect;
  }, [texture, hologramHeight]);

  // Centro vertical del plano: la imagen flota entera por encima del anillo.
  const hologramCenterY = baseY + hologramHeight / 2;
  // Haz de luz (plano con degradado): del pedestal hacia arriba, un poco más ancho que la figura.
  const hologramTopY = hologramCenterY + hologramHeight / 2;
  const shaftHeight = hologramTopY - PEDESTAL_HEIGHT;
  const shaftCenterY = PEDESTAL_HEIGHT + shaftHeight / 2;
  const shaftWidth = hologramWidth * 1.3;

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.style.cursor = isHovered ? "pointer" : "";
    return () => {
      document.body.style.cursor = "";
    };
  }, [isHovered]);

  useFrame((_, delta) => {
    timeRef.current += delta;
    // Reloj de aparición desfasado: el pilar espera su turno antes de emerger (entrada escalonada).
    const elapsed = Math.max(0, timeRef.current - activationDelaySeconds);

    // --- Activación al aparecer ---
    // Escala 0→1 (emerge minúsculo desde el centro del aro y crece a tamaño real).
    const growRaw = Math.min(1, elapsed / ACTIVATION_GROW_SECONDS);
    const growth = 1 - Math.pow(1 - growRaw, 3); // easeOutCubic
    // Parpadeo tipo "holograma que se enciende", que se calma hasta quedar estable.
    const settle = Math.min(1, elapsed / ACTIVATION_SETTLE_SECONDS);
    const flickerNoise = 0.5 + 0.5 * Math.sin(elapsed * 43.0) * Math.sin(elapsed * 19.0);
    const flicker = THREE.MathUtils.lerp(flickerNoise, 1, settle);

    const mat = materialRef.current;
    if (mat) {
      mat.uTime = timeRef.current;
      mat.uGlow = THREE.MathUtils.lerp(mat.uGlow, isHovered ? 1 : 0, 0.12);
      mat.uOpacity = HOLOGRAM_STEADY_OPACITY * Math.max(0.06, flicker);
    }
    if (shaftMaterialRef.current) {
      shaftMaterialRef.current.opacity = SHAFT_STEADY_OPACITY * Math.max(0.06, flicker) * growth;
    }
    if (holoGroupRef.current) {
      // El grupo pivota en los pies (dentro del aro): escalar crece hacia arriba desde el anillo.
      holoGroupRef.current.scale.setScalar(growth);
      // Flotación muy sutil SUMADA a la altura base.
      holoGroupRef.current.position.y = baseY + Math.sin(timeRef.current * 0.8 + floatOffset) * 0.05;
    }
  });

  const handleOver = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    if (!isHovered) onHoverSound?.();
    setIsHovered(true);
  };
  const handleOut = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    setIsHovered(false);
  };
  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    onSelect();
  };

  return (
    <group position={position}>
      {/* Pedestal cilíndrico con tapa emisiva cian. */}
      <mesh position={[0, PEDESTAL_HEIGHT / 2, 0]}>
        <cylinderGeometry args={[1.55, 1.75, PEDESTAL_HEIGHT, 48]} />
        <meshStandardMaterial color="#05202e" roughness={0.55} metalness={0.4} />
      </mesh>
      <mesh position={[0, PEDESTAL_HEIGHT + 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.28, 1.55, 48]} />
        <meshStandardMaterial
          color="#22d3ee"
          emissive="#22d3ee"
          emissiveIntensity={isHovered ? 2.4 : 1.4}
          toneMapped={false}
        />
      </mesh>

      {/* Haz de LUZ (plano con degradado suave, detrás de la figura): lee como luz volumétrica,
          no como un cilindro sólido. Brillante abajo junto al pedestal y apagándose hacia arriba. */}
      <mesh position={[0, shaftCenterY, -0.12]}>
        <planeGeometry args={[shaftWidth, shaftHeight]} />
        <meshBasicMaterial
          ref={shaftMaterialRef}
          color="#5cc9ff"
          transparent
          opacity={0}
          alphaMap={LIGHT_SHAFT_TEXTURE}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>

      {/* Luz cian que emana del pedestal para dar volumen al holograma. */}
      <pointLight position={[0, PEDESTAL_HEIGHT + 0.6, 0.6]} color="#38bdf8" intensity={isHovered ? 6 : 3.4} distance={7} />

      {/* Título futurista "en la plataforma" (HTML en el espacio 3D; no bloquea el puntero). */}
      {title ? (
        <Html
          position={[0, 0.02, 1.9]}
          center
          distanceFactor={10}
          zIndexRange={[0, 0]}
          className="pointer-events-none select-none"
        >
          <div
            className="flex items-center gap-2 whitespace-nowrap rounded-[3px] border border-cyan-300/50 bg-[#04121d]/80 px-3 py-1 shadow-[0_0_18px_rgba(34,211,238,0.35)] backdrop-blur-sm"
            style={{ fontFamily: "var(--font-orbitron)" }}
          >
            <span className="text-cyan-300/70">&#9668;</span>
            <span className="text-sm font-black uppercase tracking-[0.3em] text-cyan-100 [text-shadow:0_0_8px_rgba(34,211,238,0.8)]">
              {title}
            </span>
            <span className="text-cyan-300/70">&#9658;</span>
          </div>
        </Html>
      ) : null}

      {/* Contenido holográfico (figura o baraja). El grupo pivota en la base y su escala de
          aparición crece desde el aro. */}
      <group ref={holoGroupRef} position={[0, baseY, 0]}>
        {/* Colisionador invisible ÚNICO que capta hover/click (no el pedestal ni cada carta):
            así el sonido de hover suena solo al pasar por el holograma y no se duplica. */}
        <mesh
          position={[0, hologramHeight / 2, 0.2]}
          onPointerOver={handleOver}
          onPointerOut={handleOut}
          onClick={handleClick}
        >
          <planeGeometry args={[hologramWidth * 1.5, hologramHeight]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
        {documentationDeck ? (
          <DocumentationDeck centerY={hologramHeight * 0.52} isHovered={isHovered} />
        ) : (
          <mesh position={[0, hologramHeight / 2, 0]}>
            <planeGeometry args={[hologramWidth, hologramHeight]} />
            <academyHologramMaterial
              ref={materialRef}
              uMap={texture}
              transparent
              depthWrite={false}
              side={THREE.DoubleSide}
            />
          </mesh>
        )}
      </group>
    </group>
  );
}

