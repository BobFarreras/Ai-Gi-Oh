// src/components/hub/academy/scene/DocumentationDeck.tsx
// Baraja del pilar de Documentación: cartas REALES del juego (componente <Card>) incrustadas en el
// espacio 3D con <Html transform> de drei, en abanico desordenado. Cada carta es distinta (selección
// variada del catálogo) y con un velo holográfico cian para encajar con el resto de la escena.
"use client";

import { useMemo } from "react";
import { Html } from "@react-three/drei";
import { Card } from "@/components/game/card/Card";
import { ICard } from "@/core/entities/ICard";
import { CARD_CATALOG } from "@/infrastructure/repositories/internal/card-catalog";

// Selección fija y variada de cartas del catálogo (repartidas por tipo entidad/magia/trampa/fusión).
const DOC_DECK_CARDS: ICard[] = (() => {
  const catalog = CARD_CATALOG;
  const n = catalog.length;
  if (n === 0) return [];
  const fractions = [0.04, 0.24, 0.46, 0.68, 0.88];
  const picked = fractions
    .map((fraction) => catalog[Math.min(n - 1, Math.floor(n * fraction))])
    .filter((card): card is ICard => Boolean(card));
  // Evita duplicados por si el catálogo es pequeño.
  return Array.from(new Map(picked.map((card) => [card.id, card])).values());
})();

/** Ruido determinista 0..1 a partir de un índice, para el desorden del abanico. */
function jitter(index: number, seed: number): number {
  const x = Math.sin(index * 12.9898 + seed * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

// Tope del rango de z-index del mazo cuando usa oclusión "blending" de drei. drei sitúa el <canvas>
// en floor(tope/2) = 20, así que el DOM de las cartas queda por debajo del canvas (0..19) y el WebGL
// lo tapa por profundidad. El HUD (header/footer) debe ir por encima de 20.
export const DOC_DECK_BLENDING_ZINDEX = 40;

interface DocumentationDeckProps {
  /** Altura (dentro del grupo del pilar) a la que flota el centro de la baraja. */
  centerY: number;
  /** Como los demás hologramas: en reposo las cartas van veladas y al hacer hover se revelan. */
  isHovered: boolean;
  /**
   * Si true, cada carta usa oclusión "blending" de drei: el WebGL de la escena la tapa por
   * profundidad (para el carrusel móvil, donde los hologramas se solapan). En desktop se deja en
   * false (el DOM va encima, pero ahí los pilares no se solapan).
   */
  occludeBlending?: boolean;
}

export function DocumentationDeck({ centerY, isHovered, occludeBlending = false }: DocumentationDeckProps) {
  const cards = useMemo(() => DOC_DECK_CARDS, []);
  const count = cards.length;

  // Misma lógica que el shader de las figuras: veladas (holográficas) en reposo, nítidas en hover.
  const cardOpacity = isHovered ? 1 : 0.82;
  const veilOpacity = isHovered ? 0.12 : 1;
  const scanOpacity = isHovered ? 0.12 : 0.35;

  return (
    <group position={[0, centerY, 0]}>
      {cards.map((card, index) => {
        const t = count > 1 ? index / (count - 1) - 0.5 : 0; // -0.5 .. 0.5
        // Abanico base + desorden (posición y rotación aleatorias pero deterministas).
        const x = t * 1.9 + (jitter(index, 1) - 0.5) * 0.35;
        const y = -Math.abs(t) * 0.2 + (jitter(index, 1)) * 0.4;
        const z = index * 0.04; // orden de apilado
        const rotationZ = -t * 0.5 + (jitter(index, 3) - 0.5) * 0.28;

        return (
          <Html
            key={card.id}
            transform
            position={[x, y, z]}
            rotation={[0, 0, rotationZ]}
            distanceFactor={2}
            occlude={occludeBlending ? "blending" : undefined}
            zIndexRange={occludeBlending ? [DOC_DECK_BLENDING_ZINDEX, 0] : [0, 0]}
            style={{ pointerEvents: "none" }}
          >
            <div
              className="relative select-none"
              style={{ pointerEvents: "none", opacity: cardOpacity, transition: "opacity 350ms ease" }}
            >
              <Card
                card={card}
                isPerformanceMode
                showBackgroundInPerformanceMode
                disableHoverEffects
                disableHologram
                disableDefaultShadow
              />
              {/* Velo holográfico cian: fuerte en reposo, se desvanece al hacer hover (se revela la carta). */}
              <div
                className="pointer-events-none absolute inset-0 rounded-[18px] mix-blend-screen"
                style={{
                  background:
                    "linear-gradient(160deg, rgba(56,189,248,0.55), rgba(34,211,238,0.18) 45%, rgba(14,165,233,0.45))",
                  opacity: veilOpacity,
                  transition: "opacity 350ms ease",
                }}
              />
              <div
                className="pointer-events-none absolute inset-0 rounded-[18px]"
                style={{
                  opacity: scanOpacity,
                  transition: "opacity 350ms ease",
                  backgroundImage:
                    "repeating-linear-gradient(0deg, rgba(125,244,255,0.18) 0px, rgba(125,244,255,0.18) 1px, transparent 2px, transparent 4px)",
                }}
              />
            </div>
          </Html>
        );
      })}
    </group>
  );
}
