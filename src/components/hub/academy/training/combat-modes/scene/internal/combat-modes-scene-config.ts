// src/components/hub/academy/training/combat-modes/scene/internal/combat-modes-scene-config.ts - Nodos, colores y layout responsive del portal 3D de modos.
import {
  ACADEMY_TRAINING_ARENA_CLASSIC_ROUTE,
  ACADEMY_TRAINING_OLYMPUS_ROUTE,
  ACADEMY_TRAINING_SURVIVAL_ROUTE,
} from "@/core/constants/routes/academy-routes";

export type Vec3 = [number, number, number];
export type CombatModeSceneKind = "arena" | "survival" | "olympus";

export interface ICombatModeSceneNode {
  key: CombatModeSceneKind;
  title: string;
  route: string;
  textureUrl: string;
  /** Color del pedestal y de las luces del módulo; fija la identidad de cada modo. */
  accentColor: string;
  hologramHeight: number;
  floatOffset: number;
  activationDelaySeconds: number;
  /**
   * Umbral [brillo, saturación] del recorte de fondo blanco. Las ilustraciones vienen sin canal alfa,
   * así que el fondo se recorta en el shader. El Olimpo es mármol y nubes blancas sobre fondo blanco:
   * con el umbral laxo el recorte se comería los propios templos, así que corta casi a blanco puro.
   */
  chromaKeyThreshold: [number, number];
}

/**
 * Identidad cromática del doc de diseño (§5.1): Arena cian, Supervivencia ámbar/rojo, Olimpo oro/violeta.
 * El orden es el del carrusel móvil; el índice 0 arranca en el slot de delante.
 */
export const COMBAT_MODE_SCENE_NODES: ICombatModeSceneNode[] = [
  {
    key: "arena",
    title: "Arena clásica",
    route: ACADEMY_TRAINING_ARENA_CLASSIC_ROUTE,
    textureUrl: "/assets/combat/modes/arena.webp",
    accentColor: "#22d3ee",
    // Las tres ilustraciones son apaisadas (604x413): con altura 3.6 medirían 5.3 de ancho y se
    // tocarían entre sí. 2.5 deja ~3.6 de ancho, que respira en los tres breakpoints.
    hologramHeight: 2.5,
    floatOffset: 0,
    activationDelaySeconds: 0,
    // Estructura oscura con neón saturado: el fondo blanco se recorta sin riesgo.
    chromaKeyThreshold: [0.86, 0.12],
  },
  {
    key: "survival",
    title: "Supervivencia",
    route: ACADEMY_TRAINING_SURVIVAL_ROUTE,
    textureUrl: "/assets/combat/modes/survival.webp",
    accentColor: "#fb923c",
    hologramHeight: 2.5,
    floatOffset: 1.1,
    activationDelaySeconds: 0.18,
    // Roca gris y cascadas claras: se sube el corte para no perder las partes más luminosas.
    chromaKeyThreshold: [0.93, 0.08],
  },
  {
    key: "olympus",
    title: "Olimpo",
    route: ACADEMY_TRAINING_OLYMPUS_ROUTE,
    textureUrl: "/assets/combat/modes/olympus.webp",
    accentColor: "#c084fc",
    hologramHeight: 2.7,
    floatOffset: 2.2,
    activationDelaySeconds: 0.36,
    // Mármol y nubes blancas: solo se recorta el blanco casi puro del fondo.
    chromaKeyThreshold: [0.97, 0.05],
  },
];

export const COMBAT_MODE_SCENE_TITLES = COMBAT_MODE_SCENE_NODES.map((node) => node.title);

/** Slots del carrusel móvil en orden [delante, medio, atrás]; los hologramas se deslizan entre ellos. */
export const MOBILE_CAROUSEL_SLOTS: Vec3[] = [
  [0, 0, 3.0],
  [1.7, 0, -0.6],
  [-1.7, 0, -3.4],
];

export interface ICombatModesLayout {
  positions: Vec3[];
  cameraPosition: Vec3;
  lookAtTarget: Vec3;
  fov: number;
  pillarScale: number;
  /** Escenografía completa solo donde hay presupuesto: en móvil se reduce a la plataforma. */
  showScenery: boolean;
}

/**
 * Mismo criterio que la Academia: en móvil las posiciones las manda el carrusel y solo cuentan cámara,
 * FOV y escala. Tres módulos caben en fila sin apretarse tanto como los cuatro de la Academia.
 */
export function resolveCombatModesLayout(viewportWidth: number): ICombatModesLayout {
  if (viewportWidth < 640) {
    return {
      positions: MOBILE_CAROUSEL_SLOTS,
      cameraPosition: [0, 3.7, 10.6],
      lookAtTarget: [0, 0.9, -1.2],
      fov: 50,
      pillarScale: 0.72,
      showScenery: false,
    };
  }
  if (viewportWidth < 900) {
    return {
      positions: [[-4.2, 0, -0.6], [0, 0, -1.9], [4.2, 0, -0.6]],
      cameraPosition: [0, 2.9, 13.2],
      lookAtTarget: [0, 1.4, -0.8],
      fov: 55,
      pillarScale: 0.9,
      showScenery: true,
    };
  }
  return {
    positions: [[-5.6, 0, -0.4], [0, 0, -2.1], [5.6, 0, -0.4]],
    cameraPosition: [0, 2.7, 12.4],
    lookAtTarget: [0, 1.5, -0.8],
    fov: 48,
    pillarScale: 1,
    showScenery: true,
  };
}

/** Reordena los slots del carrusel para que `activeIndex` quede delante, conservando el ciclo. */
export function resolveCarouselPosition(nodeIndex: number, activeIndex: number, total: number): Vec3 {
  const slot = ((nodeIndex - activeIndex) % total + total) % total;
  return MOBILE_CAROUSEL_SLOTS[slot] ?? MOBILE_CAROUSEL_SLOTS[0];
}
