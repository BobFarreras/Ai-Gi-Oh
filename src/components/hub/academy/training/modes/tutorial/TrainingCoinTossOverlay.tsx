// src/components/hub/academy/training/modes/tutorial/TrainingCoinTossOverlay.tsx - Intro de BigLog + animación de moneda para iniciar el tutorial de combate.
"use client";
import Image from "next/image";
import { motion, useAnimationControls } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

interface ITrainingCoinTossOverlayProps {
  isVisible: boolean;
  starterSide: "PLAYER" | "OPPONENT";
  onContinue: () => void;
}

export function TrainingCoinTossOverlay({ isVisible, starterSide, onContinue }: ITrainingCoinTossOverlayProps) {
  const [phase, setPhase] = useState<"INTRO" | "TOSS">("INTRO");
  const [isResultVisible, setIsResultVisible] = useState(false);
  const controls = useAnimationControls();
  const winnerLabel = starterSide === "PLAYER" ? "Empiezas tú" : "Empieza BigLog";
  const playerFace = "/assets/story/player/bob.png";
  const opponentFace = "/assets/story/opponents/opp-ch1-biglog/avatar-BigLog.png";
  const winnerFaceSrc = starterSide === "PLAYER" ? playerFace : opponentFace;
  const loserFaceSrc = starterSide === "PLAYER" ? opponentFace : playerFace;
  const dropStartY = useMemo(() => (typeof window !== "undefined" ? -Math.max(window.innerHeight * 0.72, 520) : -620), []);

  useEffect(() => {
    if (!isVisible || phase !== "INTRO") return;
    const audio = new Audio("/audio/sfx/banner.mp3");
    audio.volume = 0.6;
    void audio.play().catch(() => undefined);
    return () => {
      audio.pause();
      audio.currentTime = 0;
    };
  }, [isVisible, phase]);

  useEffect(() => {
    if (!isVisible || phase !== "TOSS") return;
    let isCancelled = false;
    const playSfx = (path: string) => {
      const audio = new Audio(path);
      audio.volume = 0.72;
      void audio.play().catch(() => undefined);
    };
    const sleep = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));
    const runSequence = async () => {
      await controls.set({ x: 0, y: dropStartY, scale: 0.96, rotateY: 90, opacity: 1 });
      playSfx("/audio/story/effects/intro-coinToss.mp3");
      await controls.start({
        x: 0,
        y: [dropStartY, 30, 0],
        scale: [0.96, 1.12, 1.06],
        rotateY: [90, 540, 990, 1440],
        transition: { duration: 3.2, ease: "easeInOut", times: [0, 0.72, 0.88, 1] },
      });
      if (isCancelled) return;
      setIsResultVisible(true);
      playSfx("/audio/story/effects/final-coinToss.mp3");
      await sleep(900);
      if (!isCancelled) onContinue();
    };
    void runSequence();
    return () => {
      isCancelled = true;
    };
  }, [controls, dropStartY, isVisible, onContinue, phase]);

  if (!isVisible) return null;
  if (phase === "INTRO") {
    return (
      <section data-tutorial-overlay="true" className="pointer-events-auto fixed inset-0 z-[500] flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-sm">
        <div className="flex max-w-[min(95vw,1120px)] flex-col items-center gap-3 sm:flex-row sm:gap-6">
          <div className="relative h-[340px] w-[340px] shrink-0 overflow-visible bg-transparent sm:h-[480px] sm:w-[480px]">
            <Image src="/assets/story/opponents/opp-ch1-biglog/intro-BigLog.png" alt="Introducción de BigLog" fill sizes="(max-width: 640px) 240px, 380px" priority className="object-contain drop-shadow-[0_0_30px_rgba(34,211,238,0.48)]" />
          </div>
          <article className="relative max-w-[680px] rounded-xl border-2 border-black bg-white px-4 py-3 text-black shadow-[0_8px_0_rgba(0,0,0,0.9)] sm:px-6 sm:py-5">
            <p className="text-[11px] font-black uppercase tracking-[0.26em] text-black/70">BigLog</p>
            <h2 className="mt-1 text-lg font-black uppercase">Inicio del duelo</h2>
            <p className="mt-2 text-sm leading-relaxed sm:text-base">Vamos a lanzar la moneda para decidir quién empieza. En este tutorial empezará el jugador.</p>
            <button type="button" data-tutorial-overlay="true" onClick={() => setPhase("TOSS")} className="mt-4 rounded-md border border-black/60 px-4 py-2 text-xs font-black uppercase tracking-[0.12em]">
              Empezar
            </button>
            <span className="absolute left-[-7px] top-1/2 h-3 w-3 -translate-y-1/2 rotate-45 border-b-2 border-r-2 border-black bg-white" />
          </article>
        </div>
      </section>
    );
  }
  return (
    <div className="absolute inset-0 z-[500] flex items-center justify-center bg-black/50 backdrop-blur-md">
      <div className="text-center">
        <motion.div className="relative mx-auto h-48 w-48 [perspective:1400px]" animate={controls} style={{ transformStyle: "preserve-3d" }}>
          <div className="absolute inset-0 rounded-full border border-cyan-300/65 bg-cyan-950/55 shadow-[0_0_34px_rgba(34,211,238,0.45)] [backface-visibility:hidden] [transform:translateZ(1px)]">
            <Image src={winnerFaceSrc} alt="Cara ganadora" fill sizes="192px" quality={55} className="rounded-full object-cover p-2" />
          </div>
          <div className="absolute inset-0 rounded-full border border-rose-300/65 bg-rose-950/55 shadow-[0_0_34px_rgba(251,113,133,0.38)] [transform:rotateY(180deg)_translateZ(1px)] [backface-visibility:hidden]">
            <Image src={loserFaceSrc} alt="Cara opuesta" fill sizes="192px" quality={55} className="rounded-full object-cover p-2" />
          </div>
        </motion.div>
        <p className="mt-6 text-sm font-black uppercase tracking-[0.16em] text-cyan-100">{isResultVisible ? winnerLabel : "Lanzando moneda..."}</p>
      </div>
    </div>
  );
}
