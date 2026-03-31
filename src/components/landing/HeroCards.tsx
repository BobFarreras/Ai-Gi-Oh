// src/components/landing/HeroCards.tsx - Renderiza el abanico animado de cartas destacadas en la landing.
"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Card } from "@/components/game/card/Card";
import type { ICard } from "@/core/entities/ICard";

const LORE_CARDS: ICard[] = [
  {
    id: "sys-001",
    name: "Gemini 1.5 Pro",
    description: "Visión Multimodal: Analiza el tablero completo. Aumenta el ataque de todas las entidades aliadas. Ideal para estrategias de control total.",
    type: "ENTITY",
    faction: "BIG_TECH",
    archetype: "LLM",
    cost: 8,
    attack: 3000,
    defense: 2500,
    bgUrl: "/assets/bgs/bg-tech.jpg",
    renderUrl: "/assets/renders/gemini.webp",
    versionTier: 1,
    level: 5,
  },
  {
    id: "sys-002",
    name: "Ollama Local",
    description: "Escudo de Privacidad: Inmune a las Cartas de Ejecución (Trampas) del oponente. No requiere conexión externa para operar.",
    type: "ENTITY",
    faction: "OPEN_SOURCE",
    archetype: "LLM",
    cost: 4,
    attack: 1500,
    defense: 2800,
    bgUrl: "/assets/bgs/bg-tech.jpg",
    renderUrl: "/assets/renders/ollama.webp",
    versionTier: 1,
    level: 4,
  },
  {
    id: "sys-003",
    name: "Bucle Infinito n8n",
    description: "Atrapa el proceso del rival. Cuando el oponente ataca, su ataque es anulado y pierde el turno indefinidamente.",
    type: "TRAP",
    faction: "NO_CODE",
    archetype: "TOOL",
    trigger: "ON_OPPONENT_ATTACK_DECLARED",
    cost: 2,
    bgUrl: "/assets/bgs/bg-tech.jpg",
    renderUrl: "/assets/renders/n8n.webp",
    versionTier: 1,
    level: 1,
  }
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
  const centerScale = viewportMode === "mobile" ? 0.86 : 0.94;
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
        initial={{ opacity: 0, x: -150, rotateY: -30, rotateZ: -10 }}
        animate={{ opacity: 1, x: -fanOffset, rotateY: -20, rotateZ: -16 }}
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
        initial={{ opacity: 0, x: 150, rotateY: 30, rotateZ: 10 }}
        animate={{ opacity: 1, x: fanOffset, rotateY: 20, rotateZ: 16 }}
        transition={{ type: "spring", stiffness: 80, damping: 15, delay: 0.8 }}
        className="absolute z-20"
      >
        <Card card={LORE_CARDS[2]} disableHoverEffects />
      </motion.div>
    </div>
  );
}
