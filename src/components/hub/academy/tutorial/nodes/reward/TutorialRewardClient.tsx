// src/components/hub/academy/tutorial/nodes/reward/TutorialRewardClient.tsx - UI cliente para reclamar recompensa final del tutorial con animación y sonido.
"use client";
import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ACADEMY_TUTORIAL_MAP_ROUTE } from "@/core/constants/routes/academy-routes";
import { postTutorialRewardClaim } from "@/services/tutorial/tutorial-node-progress-client";
import { TutorialNodeState } from "@/core/entities/tutorial/ITutorialMapNode";
import { markTutorialSoundtrackFirstRunFinished } from "@/components/hub/academy/tutorial/internal/tutorial-soundtrack-session";
import { useHubModuleSfx } from "@/components/hub/internal/use-hub-module-sfx";

interface ITutorialRewardClientProps {
  rewardNodeState: TutorialNodeState;
}

const REWARD_ITEMS = [
  { label: "Nexus", value: "600", tone: "emerald", delay: 0.08 },
  { label: "Carta", value: "Mágica de fusión GemGPT", tone: "fuchsia", delay: 0.18 },
];

function resolveStateHeader(state: TutorialNodeState): { title: string; subtitle: string; tone: string } {
  if (state === "COMPLETED") {
    return {
      title: "Recompensa reclamada",
      subtitle: "Has completado el tutorial y recibido todos los premios.",
      tone: "emerald",
    };
  }
  if (state === "AVAILABLE") {
    return {
      title: "Recompensa disponible",
      subtitle: "Completa el claim para añadir los recursos a tu cuenta.",
      tone: "cyan",
    };
  }
  return {
    title: "Recompensa bloqueada",
    subtitle: "Completa los nodos Market, Arsenal y Combate para desbloquearla.",
    tone: "slate",
  };
}

export function TutorialRewardClient({ rewardNodeState }: ITutorialRewardClientProps) {
  const [status, setStatus] = useState<string | null>(null);
  const [displayState, setDisplayState] = useState<TutorialNodeState>(rewardNodeState);
  const [isLoading, setIsLoading] = useState(false);
  const [justClaimed, setJustClaimed] = useState(false);
  const { play } = useHubModuleSfx();
  const header = resolveStateHeader(displayState);
  const isLocked = displayState === "LOCKED";
  const isCompleted = displayState === "COMPLETED";

  async function handleClaim() {
    if (isLocked || isCompleted) return;
    play("BUY_PACK");
    setIsLoading(true);
    try {
      const result = await postTutorialRewardClaim();
      if (result.applied) markTutorialSoundtrackFirstRunFinished();
      setDisplayState("COMPLETED");
      setJustClaimed(result.applied);
      setStatus(result.applied ? `+${result.rewardNexus} Nexus añadidos a tu cuenta.` : "La recompensa ya estaba reclamada.");
    } catch {
      setStatus("No se pudo reclamar la recompensa final.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 200, damping: 22 }}
      className="relative mx-auto w-full max-w-3xl overflow-hidden rounded-2xl border border-cyan-300/35 bg-[#030d16]/92 p-5 shadow-[0_0_40px_rgba(34,211,238,0.18)] backdrop-blur-md sm:p-8"
    >
      {/* Glow de celebración tras reclamar */}
      <AnimatePresence>
        {justClaimed ? (
          <motion.div
            key="claim-glow"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="pointer-events-none absolute inset-0 rounded-2xl bg-[radial-gradient(ellipse_at_50%_30%,rgba(34,211,238,0.22),transparent_62%)]"
          />
        ) : null}
      </AnimatePresence>

      <header>
        <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">Nodo 4</p>
        <AnimatePresence mode="wait">
          <motion.h1
            key={header.title}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 240, damping: 22 }}
            className="mt-2 text-2xl font-black uppercase text-white sm:text-3xl"
          >
            {header.title}
          </motion.h1>
        </AnimatePresence>
        <p className="mt-2 text-sm font-semibold text-slate-300 sm:text-base">{header.subtitle}</p>
      </header>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {REWARD_ITEMS.map((reward) => (
          <motion.div
            key={reward.label}
            initial={{ opacity: 0, scale: 0.88 }}
            animate={justClaimed
              ? { opacity: 1, scale: [1, 1.06, 1], transition: { delay: reward.delay, duration: 0.5, ease: "easeOut" } }
              : { opacity: 1, scale: 1 }
            }
            transition={{ type: "spring", stiffness: 220, damping: 20, delay: reward.delay }}
            className={`rounded-xl border p-4 ${
              reward.tone === "emerald"
                ? `border-emerald-400/30 bg-emerald-950/30 ${justClaimed ? "shadow-[0_0_22px_rgba(16,185,129,0.35)]" : ""}`
                : `border-fuchsia-400/30 bg-fuchsia-950/30 ${justClaimed ? "shadow-[0_0_22px_rgba(232,121,249,0.35)]" : ""}`
            } transition-shadow duration-500`}
          >
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{reward.label}</p>
            <p className={`mt-1 text-lg font-black uppercase ${reward.tone === "emerald" ? "text-emerald-300" : "text-fuchsia-300"}`}>
              {reward.value}
            </p>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {status ? (
          <motion.p
            key="status"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ type: "spring", stiffness: 240, damping: 20 }}
            className="mt-5 text-xs font-black uppercase tracking-[0.14em] text-emerald-300"
          >
            {status}
          </motion.p>
        ) : null}
      </AnimatePresence>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        {!isCompleted ? (
          <motion.button
            type="button"
            onClick={handleClaim}
            disabled={isLoading || isLocked}
            whileTap={!isLocked && !isLoading ? { scale: 0.96 } : undefined}
            className="rounded-md border border-cyan-400/60 bg-cyan-950/80 px-5 py-2.5 text-xs font-black uppercase tracking-[0.14em] text-cyan-100 transition-colors hover:bg-cyan-900/80 disabled:cursor-not-allowed disabled:opacity-45"
          >
            {isLoading ? "Reclamando..." : isLocked ? "Bloqueado" : "Reclamar recompensa"}
          </motion.button>
        ) : null}
        <Link
          href={ACADEMY_TUTORIAL_MAP_ROUTE}
          className="rounded-md border border-slate-600 bg-slate-950/70 px-5 py-2.5 text-center text-xs font-black uppercase tracking-[0.14em] text-slate-200 transition-colors hover:bg-slate-900/80"
        >
          Volver al mapa
        </Link>
      </div>
    </motion.section>
  );
}
