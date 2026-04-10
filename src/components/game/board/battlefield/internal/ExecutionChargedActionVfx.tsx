// src/components/game/board/battlefield/internal/ExecutionChargedActionVfx.tsx - VFX y audio por fases para ejecuciones con carga previa.
"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { createAudioFromPath, safePlay } from "@/components/game/board/hooks/internal/audio/audioRuntime";

type ChargedExecutionAction = "RESTORE_ENERGY" | "DRAIN_OPPONENT_ENERGY" | "SET_CARD_DUEL_PROGRESS";

interface IExecutionChargedActionVfxProps {
  action: ChargedExecutionAction;
  isOpponentSide: boolean;
}

const CHARGE_MS = 260;
const RELEASE_MS = 170;

function playAudio(paths: string[], volume: number): HTMLAudioElement | null {
  const [path, ...fallbacks] = paths;
  const audio = createAudioFromPath(path, volume);
  if (!audio) return null;
  audio.onerror = () => {
    if (fallbacks.length > 0) playAudio(fallbacks, volume);
  };
  safePlay(audio);
  return audio;
}

function resolveEnergyTarget(action: ChargedExecutionAction, isOpponentSide: boolean): { x: number; y: number } {
  const ownerTarget = isOpponentSide ? { x: 336, y: -286 } : { x: -336, y: 286 };
  const rivalTarget = isOpponentSide ? { x: -336, y: 286 } : { x: 336, y: -286 };
  return action === "RESTORE_ENERGY" ? ownerTarget : rivalTarget;
}

export function ExecutionChargedActionVfx({ action, isOpponentSide }: IExecutionChargedActionVfxProps) {
  useEffect(() => {
    const releaseTimer = window.setTimeout(() => {
      if (action === "RESTORE_ENERGY") playAudio(["/audio/sfx/effects/execution/restore_energy.mp3", "/audio/sfx/damage.mp3"], 0.78);
      if (action === "DRAIN_OPPONENT_ENERGY") playAudio(["/audio/sfx/effects/execution/bajada.mp3"], 0.78);
      if (action === "SET_CARD_DUEL_PROGRESS") playAudio(["/audio/hub/arsenal/evolution.mp3"], 0.76);
    }, CHARGE_MS);
    return () => {
      window.clearTimeout(releaseTimer);
    };
  }, [action]);

  if (action === "SET_CARD_DUEL_PROGRESS") {
    return (
      <div className="pointer-events-none absolute inset-0 z-[260]">
        <motion.div
          initial={{ opacity: 0, scale: 0.72 }}
          animate={{ opacity: [0, 0.95, 0], scale: [0.72, 1.26, 1] }}
          transition={{ duration: CHARGE_MS / 1000, ease: "easeOut" }}
          className="absolute -inset-7 rounded-3xl bg-[radial-gradient(circle,rgba(250,204,21,0.64)_0%,rgba(250,204,21,0.2)_45%,rgba(250,204,21,0)_82%)]"
        />
        {[-1, 0, 1].map((offset, index) => (
          <motion.div
            key={`progress-ray-${offset}`}
            initial={{ opacity: 0, scaleX: 0, scaleY: 0.8, rotate: offset * 16 }}
            animate={{ opacity: [0, 1, 0], scaleX: [0, 1.2, 0.92], scaleY: [0.8, 1, 0.8], rotate: offset * 16 }}
            transition={{ duration: RELEASE_MS / 1000, delay: CHARGE_MS / 1000 + index * 0.03, ease: "easeOut" }}
            className="absolute left-1/2 top-1/2 h-2 w-52 -translate-x-1/2 -translate-y-1/2 rounded-full bg-yellow-300/90 blur-[1px]"
          />
        ))}
      </div>
    );
  }

  const target = resolveEnergyTarget(action, isOpponentSide);
  const isRestore = action === "RESTORE_ENERGY";
  const orbClass = isRestore
    ? "bg-[radial-gradient(circle,rgba(253,224,71,0.95)_0%,rgba(234,179,8,0.82)_42%,rgba(245,158,11,0.3)_80%)] shadow-[0_0_36px_rgba(234,179,8,0.95)]"
    : "bg-[radial-gradient(circle,rgba(216,180,254,0.95)_0%,rgba(168,85,247,0.8)_42%,rgba(147,51,234,0.3)_80%)] shadow-[0_0_36px_rgba(168,85,247,0.95)]";

  return (
    <div className="pointer-events-none absolute inset-0 z-[260]">
      <motion.div
        initial={{ opacity: 0, scale: 0.72 }}
        animate={{ opacity: [0, 0.95, 0], scale: [0.72, 1.24, 1.02] }}
        transition={{ duration: CHARGE_MS / 1000, ease: "easeOut" }}
        className={isRestore
          ? "absolute -inset-7 rounded-3xl bg-[radial-gradient(circle,rgba(250,204,21,0.62)_0%,rgba(250,204,21,0.2)_46%,rgba(250,204,21,0)_82%)]"
          : "absolute -inset-7 rounded-3xl bg-[radial-gradient(circle,rgba(192,132,252,0.6)_0%,rgba(192,132,252,0.2)_46%,rgba(192,132,252,0)_82%)]"
        }
      />
      <motion.div
        initial={{ opacity: 0, x: 0, y: 0, scale: 0.66 }}
        animate={{ opacity: [0, 1, 1, 0], x: [0, target.x], y: [0, target.y], scale: [0.66, 0.58, 0.42] }}
        transition={{ duration: (CHARGE_MS + RELEASE_MS) / 1000, delay: CHARGE_MS / 1000, ease: "easeInOut" }}
        className={`absolute left-1/2 top-1/2 h-14 w-14 -translate-x-1/2 -translate-y-1/2 rounded-full ${orbClass}`}
      />
      {!isRestore ? (
        <>
          {Array.from({ length: 5 }).map((_, index) => (
            <motion.div
              key={`drain-smoke-${index}`}
              initial={{ opacity: 0, y: 10 + index * 2, scale: 0.7 }}
              animate={{ opacity: [0, 0.92, 0], y: [10 + index * 2, -20 - index * 4, -48 - index * 6], scale: [0.7, 1.08, 0.9] }}
              transition={{ duration: 0.56 + index * 0.06, ease: "easeOut" }}
              className="absolute left-1/2 top-1/2 h-10 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-300/70 blur-md"
            />
          ))}
          <motion.div
            initial={{ opacity: 0, x: 0, y: 0, scaleX: 0.4 }}
            animate={{ opacity: [0, 0.95, 0], x: [0, target.x], y: [0, target.y], scaleX: [0.4, 1.2, 0.7] }}
            transition={{ duration: 0.58, delay: CHARGE_MS / 1000, ease: "easeInOut" }}
            className="absolute left-1/2 top-1/2 h-2 w-60 -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-300/90 blur-[1px]"
          />
        </>
      ) : null}
    </div>
  );
}
