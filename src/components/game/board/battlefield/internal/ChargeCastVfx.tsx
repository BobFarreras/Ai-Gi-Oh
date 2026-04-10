// src/components/game/board/battlefield/internal/ChargeCastVfx.tsx - Capa visual de carga para ejecuciones/trampas por encima del holograma.
"use client";

import { motion } from "framer-motion";

interface IChargeCastVfxProps {
  tone: "yellow" | "violet" | "red" | "fuchsia";
  zIndexClass?: string;
}

function resolveClasses(tone: IChargeCastVfxProps["tone"]): { aura: string; smoke: string } {
  if (tone === "red") {
    return {
      aura: "bg-[radial-gradient(circle,rgba(248,113,113,0.56)_0%,rgba(248,113,113,0.14)_48%,rgba(248,113,113,0)_84%)]",
      smoke: "bg-red-300/75",
    };
  }
  if (tone === "violet") {
    return {
      aura: "bg-[radial-gradient(circle,rgba(192,132,252,0.58)_0%,rgba(192,132,252,0.18)_48%,rgba(192,132,252,0)_84%)]",
      smoke: "bg-violet-300/75",
    };
  }
  if (tone === "yellow") {
    return {
      aura: "bg-[radial-gradient(circle,rgba(250,204,21,0.58)_0%,rgba(250,204,21,0.18)_48%,rgba(250,204,21,0)_84%)]",
      smoke: "bg-yellow-300/75",
    };
  }
  return {
    aura: "bg-[radial-gradient(circle,rgba(217,70,239,0.58)_0%,rgba(217,70,239,0.18)_48%,rgba(217,70,239,0)_84%)]",
    smoke: "bg-fuchsia-300/75",
  };
}

export function ChargeCastVfx({ tone, zIndexClass = "z-[280]" }: IChargeCastVfxProps) {
  const palette = resolveClasses(tone);
  return (
    <div className={`pointer-events-none absolute inset-0 ${zIndexClass}`}>
      <motion.div
        initial={{ opacity: 0, scale: 0.72 }}
        animate={{ opacity: [0, 1, 0], scale: [0.72, 1.2, 0.96] }}
        transition={{ duration: 0.62, ease: "easeOut" }}
        className={`absolute -inset-7 rounded-3xl ${palette.aura}`}
      />
      {Array.from({ length: 5 }).map((_, index) => (
        <motion.div
          key={`charge-smoke-${index}`}
          initial={{ opacity: 0, y: 10 + index * 2, scale: 0.66 }}
          animate={{ opacity: [0, 0.9, 0], y: [10 + index * 2, -16 - index * 4, -42 - index * 6], scale: [0.66, 1.05, 0.88] }}
          transition={{ duration: 0.54 + index * 0.06, ease: "easeOut" }}
          className={`absolute left-1/2 top-1/2 h-10 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full ${palette.smoke} blur-md`}
        />
      ))}
    </div>
  );
}
