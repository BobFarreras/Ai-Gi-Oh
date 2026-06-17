// src/components/hub/multiplayer/MultiplayerCoinTossOverlay.tsx - Overlay de moneda compartida para decidir quién empieza el duelo multijugador.
"use client";

import { motion, useAnimationControls } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

interface IMultiplayerCoinTossOverlayProps {
  isVisible: boolean;
  starterSide: "PLAYER" | "OPPONENT";
  playerName: string;
  opponentName: string;
  onComplete?: () => void;
}

function initials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "?";
  return trimmed.slice(0, 2).toUpperCase();
}

export function MultiplayerCoinTossOverlay({
  isVisible,
  starterSide,
  playerName,
  opponentName,
  onComplete,
}: IMultiplayerCoinTossOverlayProps) {
  const winnerLabel = starterSide === "PLAYER" ? playerName : opponentName;
  const winnerInitials = initials(winnerLabel);
  const loserInitials = initials(starterSide === "PLAYER" ? opponentName : playerName);
  const [isResultVisible, setIsResultVisible] = useState(false);
  const controls = useAnimationControls();
  const dropStartY = useMemo(
    () => (typeof window !== "undefined" ? -Math.max(window.innerHeight * 0.72, 520) : -620),
    [],
  );

  useEffect(() => {
    if (!isVisible) return;
    let isCancelled = false;

    const sleep = (ms: number) =>
      new Promise<void>((resolve) => {
        window.setTimeout(() => resolve(), ms);
      });

    const runSequence = async () => {
      setIsResultVisible(false);
      await controls.set({ y: dropStartY, scale: 0.96, rotateY: 90, opacity: 1 });
      await controls.start({
        y: [dropStartY, 30, 0],
        scale: [0.96, 1.12, 1.06],
        rotateY: [90, 540, 990, 1440],
        transition: { duration: 3.2, ease: "easeInOut", times: [0, 0.72, 0.88, 1] },
      });
      if (isCancelled) return;
      setIsResultVisible(true);
      await sleep(900);
      if (isCancelled) return;
      await controls.start({ scale: 0.3, opacity: 0, transition: { duration: 0.6, ease: "easeInOut" } });
      if (!isCancelled) onComplete?.();
    };

    void runSequence();

    return () => {
      isCancelled = true;
    };
  }, [controls, dropStartY, isVisible, onComplete]);

  if (!isVisible) return null;

  return (
    <div className="absolute inset-0 z-[320] flex items-center justify-center bg-black/55 backdrop-blur-md">
      <div className="text-center">
        <motion.div
          className="relative mx-auto h-44 w-44 [perspective:1400px]"
          animate={controls}
          style={{ transformStyle: "preserve-3d" }}
        >
          <div className="absolute inset-0 flex items-center justify-center rounded-full border border-cyan-300/65 bg-cyan-950/60 text-3xl font-black text-cyan-100 shadow-[0_0_34px_rgba(34,211,238,0.45)] [backface-visibility:hidden] [transform:translateZ(1px)]">
            {winnerInitials}
          </div>
          <div className="absolute inset-0 flex items-center justify-center rounded-full border border-rose-300/65 bg-rose-950/60 text-3xl font-black text-rose-100 shadow-[0_0_34px_rgba(251,113,133,0.38)] [transform:rotateY(180deg)_translateZ(1px)] [backface-visibility:hidden]">
            {loserInitials}
          </div>
        </motion.div>
        <p className="mt-6 text-sm font-black uppercase tracking-[0.16em] text-cyan-100">
          {isResultVisible ? `Empieza: ${winnerLabel}` : "Lanzando moneda..."}
        </p>
      </div>
    </div>
  );
}
