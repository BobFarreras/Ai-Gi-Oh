// src/components/landing/HeroCards.tsx - Renderiza el abanico animado de cartas destacadas en la landing.
"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Card } from "@/components/game/card/Card";
import type { ICard } from "@/core/entities/ICard";
import { ENTITY_CARDS } from "@/core/data/mock-cards/entities";
import { TRAP_CARDS } from "@/core/data/mock-cards/traps";

function getCardOrThrow(cards: ICard[], cardId: string): ICard {
  const card = cards.find((candidate) => candidate.id === cardId);
  if (!card) {
    throw new Error(`No se encontró la carta requerida para landing: ${cardId}.`);
  }
  return card;
}

const LORE_CARDS: ICard[] = [
  getCardOrThrow(ENTITY_CARDS, "entity-gemini"),
  getCardOrThrow(ENTITY_CARDS, "entity-chatgpt"),
  getCardOrThrow(TRAP_CARDS, "trap-kernel-panic"),
];

function resolveViewportMode() {
  if (typeof window === "undefined") return "desktop";
  if (typeof window.matchMedia !== "function") return "desktop";
  if (window.matchMedia("(max-width: 639px)").matches) return "mobile";
  if (window.matchMedia("(min-width: 640px) and (max-width: 1023px)").matches) return "tablet";
  return "desktop";
}

export function HeroCards({ onCardReveal }: { onCardReveal?: (d: number) => void }) {
  const [viewportMode, setViewportMode] = useState(resolveViewportMode());

  useEffect(() => {
    const syncViewport = () => setViewportMode(resolveViewportMode());
    window.addEventListener("resize", syncViewport);
    if (onCardReveal) {
      [200, 500, 800].forEach(d => onCardReveal(d));
    }
    return () => window.removeEventListener("resize", syncViewport);
  }, [onCardReveal]);

  const fanOffset = viewportMode === "mobile" ? 142 : viewportMode === "tablet" ? 182 : 230;
  const centerYOffset = viewportMode === "mobile" ? -8 : -16;
  const centerScale = viewportMode === "mobile" ? 0.94 : viewportMode === "tablet" ? 1 : 1.04;
  const sideScale = viewportMode === "mobile" ? 0.84 : viewportMode === "tablet" ? 0.9 : 0.94;
  const wrapperScale = viewportMode === "mobile" ? "scale-[0.5]" : viewportMode === "tablet" ? "scale-[0.62]" : "scale-[0.84]";

  // Estilo para arreglar el desenfoque (Anti-aliasing fix)
  const crispStyle = {
    backfaceVisibility: "hidden" as const,
    WebkitFontSmoothing: "subpixel-antialiased" as const,
    willChange: "transform, opacity",
  };

  return (
    <div className={`relative flex h-full w-full items-center justify-center perspective-[1200px] ${wrapperScale}`}>
      
      {/* Carta Izquierda */}
      <motion.div
        style={crispStyle}
        initial={{ opacity: 0, x: -150, rotateY: -30, rotateZ: -10, scale: sideScale }}
        animate={{ opacity: 1, x: -fanOffset, rotateY: -20, rotateZ: -16, scale: sideScale }}
        transition={{ type: "spring", stiffness: 80, damping: 15, delay: 0.2 }}
        className="absolute z-10"
      >
        <Card card={LORE_CARDS[1]} disableHoverEffects />
      </motion.div>

      {/* Carta Centro */}
      <motion.div
        style={crispStyle}
        initial={{ opacity: 0, y: 100, scale: 0.8 }}
        animate={{ opacity: 1, y: centerYOffset, scale: centerScale }}
        transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.5 }}
        className="absolute z-30"
      >
        <Card card={LORE_CARDS[0]} disableHoverEffects clipToFrameShape disableDefaultShadow />
      </motion.div>

      {/* Carta Derecha */}
      <motion.div
        style={crispStyle}
        initial={{ opacity: 0, x: 150, rotateY: 30, rotateZ: 10, scale: sideScale }}
        animate={{ opacity: 1, x: fanOffset, rotateY: 20, rotateZ: 16, scale: sideScale }}
        transition={{ type: "spring", stiffness: 80, damping: 15, delay: 0.8 }}
        className="absolute z-20"
      >
        <Card card={LORE_CARDS[2]} disableHoverEffects />
      </motion.div>
    </div>
  );
}
