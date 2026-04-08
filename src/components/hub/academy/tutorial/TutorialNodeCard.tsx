// src/components/hub/academy/tutorial/TutorialNodeCard.tsx - Tarjeta de nodo tutorial con estilo HUD, arte contextual y estados guiados.
"use client";

import { motion, Transition } from "framer-motion";
import Link from "next/link";
import { ONBOARDING_AUDIO_CATALOG } from "@/components/hub/onboarding/internal/onboarding-audio-catalog";
import { TutorialNodeCardMedia } from "@/components/hub/academy/tutorial/internal/TutorialNodeCardMedia";
import { ITutorialMapNodeRuntime } from "@/core/entities/tutorial/ITutorialMapNode";

interface ITutorialNodeCardProps {
  node: ITutorialMapNodeRuntime;
  isForcedSelectable?: boolean;
  isForcedDisabled?: boolean;
}

const snappySpring: Transition = { type: "spring", stiffness: 360, damping: 24 };

function playCardClickSfx(): void {
  const audio = new Audio(ONBOARDING_AUDIO_CATALOG.buttonClick);
  audio.volume = 0.62;
  void audio.play().catch(() => undefined);
}

export function TutorialNodeCard({ node, isForcedSelectable = false, isForcedDisabled = false }: ITutorialNodeCardProps) {
  const isCompleted = node.state === "COMPLETED";
  const isAvailable = !isForcedDisabled && (isForcedSelectable || node.state === "AVAILABLE");
  const isLocked = isForcedDisabled || node.state === "LOCKED";

  const borderTone = isCompleted
    ? "border-emerald-500/65"
    : isForcedSelectable
      ? "border-cyan-300 shadow-[0_0_34px_rgba(34,211,238,0.5)]"
      : isAvailable
        ? "border-cyan-400/75"
        : "border-slate-800/80";
  const bgTone = isCompleted ? "bg-emerald-950/20" : isAvailable ? "bg-[#061428]/85" : "bg-slate-900/45 grayscale opacity-55";
  const textTone = isCompleted ? "text-emerald-100" : isAvailable ? "text-cyan-100" : "text-slate-500";
  const accentTone = isCompleted ? "text-emerald-300" : "text-cyan-300";

  return (
    <motion.article
      whileHover={isLocked ? {} : { scale: 1.01, y: -3 }}
      whileTap={isLocked ? {} : { scale: 0.985 }}
      transition={snappySpring}
      className={`group relative flex h-full flex-col overflow-hidden rounded-2xl border ${borderTone} ${bgTone} backdrop-blur-sm ${isLocked ? "" : "cursor-pointer"}`}
    >
      {!isLocked ? <Link aria-label={`Abrir ${node.title}`} href={node.href} onClick={() => playCardClickSfx()} className="absolute inset-0 z-20" /> : null}
      <div className="pointer-events-none absolute inset-[2px] rounded-[14px] border border-cyan-300/10" />
      <div className="pointer-events-none absolute left-2 top-2 h-4 w-4 border-l border-t border-cyan-300/50" />
      <div className="pointer-events-none absolute bottom-2 right-2 h-4 w-4 border-b border-r border-cyan-300/50" />

      <div className="relative h-[36%] min-h-[108px] w-full overflow-hidden border-b border-slate-700/75">
        <TutorialNodeCardMedia node={node} />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#020b16] via-[#031322]/35 to-transparent" />
      </div>

      <div className="relative z-10 flex min-h-0 flex-1 flex-col justify-between p-3 sm:p-4 lg:p-5">
        <div className="text-center">
          <header className="flex items-center justify-between gap-2">
            <p className={`text-[10px] font-black uppercase tracking-[0.22em] lg:text-[11px] ${accentTone}`}>SYS.{node.kind}</p>
            <div className={`h-2 w-2 rounded-full ${isCompleted ? "bg-emerald-300" : "bg-cyan-300"} shadow-[0_0_10px_currentColor]`} />
          </header>

          <h2 className={`mt-2 text-2xl font-black uppercase tracking-[0.05em] sm:text-3xl lg:text-[1.75rem] ${textTone}`}>{node.title}</h2>
          <p className="mx-auto mt-2 max-w-[38ch] text-base font-semibold leading-relaxed text-slate-200 sm:text-lg lg:text-base">{node.description}</p>
        </div>

        <footer className="mt-3 border-t border-slate-700/60 pt-2.5 lg:pt-3">
          {isLocked ? (
            <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              {isForcedDisabled ? "En espera del tutorial" : "Acceso bloqueado"}
            </span>
          ) : (
            <span className={`flex items-center justify-between rounded-md bg-white/5 px-3 py-2 text-xs font-black uppercase tracking-[0.16em] transition-colors group-hover:bg-white/10 ${accentTone}`}>
              <span>{isCompleted ? "Revisar nodo" : "Iniciar nodo"}</span>
              <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
            </span>
          )}
        </footer>
      </div>
    </motion.article>
  );
}
