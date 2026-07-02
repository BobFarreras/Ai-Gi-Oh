// src/components/hub/academy/glossary/EffectVfxDemo.tsx
// Demostración en bucle del efecto dentro del diálogo del Códex: reproduce el token visual del
// arquetipo del efecto con el mismo lenguaje del combate (colores/números flotantes/glow), y reutiliza
// el VFX real de curación. No depende del estado del tablero (es una vista previa aislada).
"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ExecutionHealVfx } from "@/components/game/board/battlefield/internal/ExecutionHealVfx";

type DemoKind = "damage" | "heal" | "energy" | "buff" | "debuff" | "draw" | "generic";

/** Deriva el arquetipo visual del efecto a partir de su clave técnica (heurística para la vista previa). */
function resolveDemoKind(effectKey: string): DemoKind {
  const key = effectKey.toUpperCase();
  if (key.includes("HEAL")) return "heal";
  if (key.includes("DAMAGE") || key.includes("DIRECT_HIT") || key.includes("REFLECT")) return "damage";
  if (key.includes("ENERGY")) return "energy";
  if (key.includes("DRAIN") || key.includes("REDUCE_OPPONENT")) return "debuff";
  if (key.includes("BOOST") || key.includes("ATTACK_BONUS") || key.includes("ATK_GROWTH") || key.includes("SET_DEFENSE") || key.includes("BOOST_DEFENSE")) return "buff";
  if (key.includes("DRAW")) return "draw";
  return "generic";
}

interface IDemoStyle {
  glow: string;
  text: string;
  label: (amount?: number) => string;
}

const DEMO_STYLES: Record<Exclude<DemoKind, "heal">, IDemoStyle> = {
  damage: {
    glow: "radial-gradient(circle, rgba(239,68,68,0.6) 0%, rgba(239,68,68,0.12) 45%, transparent 78%)",
    text: "text-red-400 drop-shadow-[0_0_20px_rgba(239,68,68,1)]",
    label: (amount) => `−${amount ?? 600}`,
  },
  energy: {
    glow: "radial-gradient(circle, rgba(250,204,21,0.55) 0%, rgba(250,204,21,0.12) 45%, transparent 78%)",
    text: "text-yellow-300 drop-shadow-[0_0_20px_rgba(250,204,21,1)]",
    label: (amount) => `+${amount ?? 1}⚡`,
  },
  buff: {
    glow: "radial-gradient(circle, rgba(251,191,36,0.55) 0%, rgba(245,158,11,0.14) 45%, transparent 80%)",
    text: "text-amber-300 drop-shadow-[0_0_20px_rgba(245,158,11,1)]",
    label: (amount) => `+${amount ?? ""} ATK`.trim(),
  },
  debuff: {
    glow: "radial-gradient(circle, rgba(168,85,247,0.55) 0%, rgba(168,85,247,0.14) 45%, transparent 80%)",
    text: "text-violet-400 drop-shadow-[0_0_20px_rgba(168,85,247,1)]",
    label: (amount) => `−${amount ?? ""} ATK`.trim(),
  },
  draw: {
    glow: "radial-gradient(circle, rgba(34,211,238,0.55) 0%, rgba(34,211,238,0.14) 45%, transparent 80%)",
    text: "text-cyan-200 drop-shadow-[0_0_20px_rgba(34,211,238,1)]",
    label: () => "DRAW",
  },
  generic: {
    glow: "radial-gradient(circle, rgba(217,70,239,0.5) 0%, rgba(217,70,239,0.14) 45%, transparent 80%)",
    text: "text-fuchsia-200 drop-shadow-[0_0_20px_rgba(217,70,239,1)]",
    label: () => "EFFECT",
  },
};

interface EffectVfxDemoProps {
  effectKey: string;
  /** Magnitud real de la carta de ejemplo (si su efecto lleva un valor), para un número fiel. */
  amount?: number;
}

export function EffectVfxDemo({ effectKey, amount }: EffectVfxDemoProps) {
  const kind = resolveDemoKind(effectKey);
  const [replay, setReplay] = useState(0);

  // Reproduce la animación en bucle para que se aprecie bien.
  useEffect(() => {
    const id = window.setInterval(() => setReplay((value) => value + 1), 2600);
    return () => window.clearInterval(id);
  }, []);

  const style = kind === "heal" ? null : DEMO_STYLES[kind];

  return (
    <div className="relative mt-5 h-44 w-full overflow-hidden rounded-xl border border-cyan-400/20 bg-[#02101c]">
      {/* Rejilla tenue tipo tablero. */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(56,189,248,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(56,189,248,0.06)_1px,transparent_1px)] bg-[size:26px_26px]" />
      <p className="absolute left-2 top-2 z-10 text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400/60">Vista previa</p>

      {kind === "heal" ? (
        <div className="absolute inset-0" key={replay}>
          <ExecutionHealVfx isOpponentSide={false} />
        </div>
      ) : style ? (
        <div className="absolute inset-0">
          <motion.div
            key={`glow-${replay}`}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: [0, 0.85, 0], scale: [0.6, 1.25, 1] }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{ background: style.glow }}
          />
          <motion.div
            key={`label-${replay}`}
            initial={{ y: 22, opacity: 0, scale: 0.8 }}
            animate={{ y: [22, -14, -54], opacity: [0, 1, 0], scale: [0.8, 1.35, 1.15] }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-4xl font-black ${style.text}`}
          >
            {style.label(amount)}
          </motion.div>
        </div>
      ) : null}
    </div>
  );
}
