// src/app/hub/story/chapter/[chapter]/duel/[duelIndex]/StoryDuelCoinTossOverlay.tsx - Overlay inicial de moneda para decidir quién comienza el duelo Story.
"use client";
import Image from "next/image";
import { motion, useAnimationControls } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

interface IStoryDuelCoinTossOverlayProps {
  isVisible: boolean;
  starterSide: "PLAYER" | "OPPONENT";
  playerName: string;
  opponentName: string;
  playerAvatarUrl: string;
  opponentAvatarUrl: string;
  onComplete?: () => void;
}

export function StoryDuelCoinTossOverlay({
  isVisible,
  starterSide,
  playerName,
  opponentName,
  playerAvatarUrl,
  opponentAvatarUrl,
  onComplete,
}: IStoryDuelCoinTossOverlayProps) {
  const winnerLabel = starterSide === "PLAYER" ? playerName : opponentName;
  const winnerFaceSrc = starterSide === "PLAYER" ? playerAvatarUrl : opponentAvatarUrl;
  const loserFaceSrc = starterSide === "PLAYER" ? opponentAvatarUrl : playerAvatarUrl;
  const [isResultVisible, setIsResultVisible] = useState(false);
  const controls = useAnimationControls();
  const dropStartY = useMemo(() => (typeof window !== "undefined" ? -Math.max(window.innerHeight * 0.72, 520) : -620), []);
  const travelOffset = useMemo(
    () =>
      starterSide === "PLAYER"
        ? { x: typeof window !== "undefined" ? -window.innerWidth * 0.36 : -420, y: typeof window !== "undefined" ? window.innerHeight * 0.34 : 280 }
        : { x: typeof window !== "undefined" ? window.innerWidth * 0.36 : 420, y: typeof window !== "undefined" ? -window.innerHeight * 0.34 : -280 },
    [starterSide],
  );

  useEffect(() => {
    if (!isVisible) return;
    let isCancelled = false;
    const resetTimeout = window.setTimeout(() => setIsResultVisible(false), 0);

    const playSfx = (path: string) => {
      const audio = new Audio(path);
      audio.volume = 0.72;
      void audio.play().catch(() => undefined);
    };

    const sleep = (ms: number) =>
      new Promise<void>((resolve) => {
        window.setTimeout(() => resolve(), ms);
      });

    const runCoinTossSequence = async () => {
      await controls.set({ x: 0, y: dropStartY, scale: 0.96, rotateY: 90, opacity: 1 });
      playSfx("/audio/story/effects/intro-coinToss.mp3");
      await controls.start({
        x: 0,
        y: [dropStartY, 30, 0],
        scale: [0.96, 1.12, 1.06],
        rotateY: [90, 540, 990, 1440],
        transition: { duration: 3.35, ease: "easeInOut", times: [0, 0.72, 0.88, 1] },
      });
      if (isCancelled) return;
      setIsResultVisible(true);
      await sleep(650);
      if (isCancelled) return;
      playSfx("/audio/story/effects/final-coinToss.mp3");
      await controls.start({
        x: travelOffset.x,
        y: travelOffset.y,
        scale: 0.28,
        rotateY: 1440,
        opacity: 0.92,
        transition: { duration: 0.95, ease: "easeInOut" },
      });
      if (!isCancelled) onComplete?.();
    };

    void runCoinTossSequence();

    return () => {
      isCancelled = true;
      window.clearTimeout(resetTimeout);
    };
  }, [controls, dropStartY, isVisible, onComplete, travelOffset.x, travelOffset.y]);

  if (!isVisible) return null;

  return (
    <div className="absolute inset-0 z-[320] flex items-center justify-center bg-black/45 backdrop-blur-md">
      <div className="text-center">
        <motion.div
          className="relative mx-auto h-48 w-48 [perspective:1400px]"
          animate={controls}
          style={{ transformStyle: "preserve-3d" }}
        >
          <div className="absolute inset-0 rounded-full border border-cyan-300/65 bg-cyan-950/55 shadow-[0_0_34px_rgba(34,211,238,0.45)] [backface-visibility:hidden] [transform:translateZ(1px)]">
            <Image src={winnerFaceSrc} alt="Cara ganadora" fill sizes="192px" quality={55} className="rounded-full object-cover p-2" />
          </div>
          <div className="absolute inset-0 rounded-full border border-rose-300/65 bg-rose-950/55 shadow-[0_0_34px_rgba(251,113,133,0.38)] [transform:rotateY(180deg)_translateZ(1px)] [backface-visibility:hidden]">
            <Image src={loserFaceSrc} alt="Cara opuesta" fill sizes="192px" quality={55} className="rounded-full object-cover p-2" />
          </div>
        </motion.div>
        <p className="mt-6 text-sm font-black uppercase tracking-[0.16em] text-cyan-100">
          {isResultVisible ? `Empieza: ${winnerLabel}` : "Lanzando moneda..."}
        </p>
      </div>
    </div>
  );
}
