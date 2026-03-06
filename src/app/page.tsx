// src/app/page.tsx - Landing principal con persistencia de intro, audio contextual y acceso a login/registro.
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { AnimatePresence, motion, Variants } from "framer-motion";
import { CrawlText } from "@/components/landing/CrawlText";
import { CyberBackground } from "@/components/landing/CyberBackground";
import { HeroCards } from "@/components/landing/HeroCards";
import { TerminalPrompt } from "@/components/landing/TerminalPrompt";
import { useLandingAudio } from "@/components/landing/useLandingAudio";

type LandingPhase = "TERMINAL" | "NARRATIVE" | "SHOWCASE";
const LANDING_INTRO_SEEN_KEY = "landing-intro-seen";

export default function HomePage() {
  const [phase, setPhase] = useState<LandingPhase>("TERMINAL");
  const [isReady, setIsReady] = useState(false);
  const [userCode, setUserCode] = useState("");
  const { playButtonClick, playTerminalBoot, playHeroCardDeploy, stopNarrationTrack } = useLandingAudio({ isNarrativeActive: phase === "NARRATIVE" });

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const introSeen = window.localStorage.getItem(LANDING_INTRO_SEEN_KEY) === "1";
      if (introSeen) setPhase("SHOWCASE");
      setIsReady(true);
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

  const toNarrative = (code: string) => {
    setUserCode(code);
    setPhase("NARRATIVE");
  };
  const toShowcase = () => {
    stopNarrationTrack();
    window.localStorage.setItem(LANDING_INTRO_SEEN_KEY, "1");
    setPhase("SHOWCASE");
  };
  const replayIntro = () => {
    playButtonClick();
    stopNarrationTrack();
    window.localStorage.removeItem(LANDING_INTRO_SEEN_KEY);
    setUserCode("");
    setPhase("TERMINAL");
  };
  useEffect(() => {
    if (phase !== "TERMINAL") return;
    playTerminalBoot();
  }, [phase, playTerminalBoot]);

  const containerVariants: Variants = useMemo(() => ({ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.3, delayChildren: 0.2 } } }), []);
  const itemVariants: Variants = useMemo(() => ({ hidden: { opacity: 0, y: 30, scale: 0.9 }, visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 100, damping: 15 } } }), []);

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-[#010308] selection:bg-cyan-500/30">
      <CyberBackground />
      {!isReady ? null : (
        <>
          <AnimatePresence mode="wait">
            {phase === "TERMINAL" ? <TerminalPrompt key="terminal" onComplete={toNarrative} onAction={playButtonClick} /> : null}
          </AnimatePresence>

          <AnimatePresence>
            {phase === "NARRATIVE" ? (
              <motion.div key="narrative" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.5 } }} className="absolute inset-0 z-40">
                <CrawlText accessCode={userCode} onSkip={toShowcase} onAction={playButtonClick} />
              </motion.div>
            ) : null}
          </AnimatePresence>

          <AnimatePresence>
            {phase === "SHOWCASE" ? (
              <motion.div key="showcase" variants={containerVariants} initial="hidden" animate="visible" className="absolute inset-0 z-30 flex h-dvh flex-col items-center justify-between overflow-x-visible overflow-y-auto px-4 py-8 pointer-events-auto md:overflow-x-hidden sm:px-6">
                <motion.header variants={itemVariants} className="relative mt-2 flex-shrink-0 text-center">
                  <h1 className="bg-gradient-to-br from-white via-cyan-100 to-cyan-600 bg-clip-text text-4xl font-black uppercase tracking-tighter text-transparent drop-shadow-[0_0_15px_rgba(6,182,212,0.6)] md:text-5xl lg:text-6xl">AI-GI-OH</h1>
                  <span className="mt-2 block font-mono text-lg tracking-[0.3em] text-cyan-500 md:text-xl lg:text-2xl">THE AGI WARS</span>
                </motion.header>

                <motion.div variants={itemVariants} className="flex min-h-[300px] w-full max-w-5xl flex-1 items-center justify-center">
                  <HeroCards onCardReveal={playHeroCardDeploy} />
                </motion.div>

                <motion.footer variants={itemVariants} className="flex w-full max-w-3xl flex-shrink-0 flex-col items-center justify-center gap-4 sm:flex-row">
                  <Link href="/register" onClick={playButtonClick} className="group relative flex h-14 w-full items-center justify-center overflow-hidden bg-cyan-500 px-4 font-mono text-xs font-black uppercase tracking-[0.2em] text-black transition-all hover:bg-cyan-400 hover:shadow-[0_0_30px_rgba(6,182,212,0.8)] sm:h-16 sm:w-1/2 sm:px-8 sm:text-sm" style={{ clipPath: "polygon(20px 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%, 0 20px)" }}>
                    <div className="pointer-events-none absolute inset-0 -translate-x-full skew-x-12 bg-white/40 transition-transform duration-500 ease-out group-hover:translate-x-full" />
                    <span>Compilar ID</span>
                  </Link>
                  <Link href="/login" onClick={playButtonClick} className="relative flex h-14 w-full items-center justify-center border border-cyan-500/50 bg-black/60 px-4 font-mono text-xs font-bold uppercase tracking-[0.2em] text-cyan-400 backdrop-blur-md transition-all hover:border-cyan-300 hover:bg-cyan-900/40 hover:text-cyan-200 sm:h-16 sm:w-1/2 sm:px-8 sm:text-sm" style={{ clipPath: "polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 20px 100%, 0 calc(100% - 20px))" }}>
                    Conexión Red
                  </Link>
                </motion.footer>
              </motion.div>
            ) : null}
          </AnimatePresence>
          {phase === "SHOWCASE" ? (
            <button
              aria-label="Reproducir secuencia terminal y narración"
              onClick={replayIntro}
              className="fixed right-4 top-4 z-[80] flex h-11 w-11 items-center justify-center border border-cyan-500/45 bg-black/75 text-cyan-300 transition-all hover:border-cyan-300 hover:text-cyan-100 md:bottom-6 md:right-6 md:top-auto md:h-auto md:w-auto md:px-4 md:py-3 md:font-mono md:text-[10px] md:font-black md:uppercase md:tracking-[0.16em]"
            >
              <RotateCcw className="h-4 w-4 md:hidden" />
              <span className="hidden md:inline">Reproducir Intro</span>
            </button>
          ) : null}
          {phase === "TERMINAL" ? (
            <button
              aria-label="Ir directo a la landing"
              onClick={() => {
                playButtonClick();
                toShowcase();
              }}
              className="fixed left-4 top-4 z-[80] flex h-11 w-11 items-center justify-center border border-cyan-500/45 bg-black/75 text-cyan-300 transition-all hover:border-cyan-300 hover:text-cyan-100 md:bottom-6 md:left-auto md:right-6 md:top-auto md:h-auto md:w-auto md:px-4 md:py-3 md:font-mono md:text-[10px] md:font-black md:uppercase md:tracking-[0.16em]"
            >
              <ArrowLeft className="h-4 w-4 md:hidden" />
              <span className="hidden md:inline">Ir a Landing</span>
            </button>
          ) : null}
        </>
      )}
    </main>
  );
}
