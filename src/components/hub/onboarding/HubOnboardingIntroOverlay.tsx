// src/components/hub/onboarding/HubOnboardingIntroOverlay.tsx - Secuencia narrativa inicial de Academy con decisión guiada o salto libre.
"use client";

import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { ACADEMY_TUTORIAL_MAP_ROUTE } from "@/core/constants/routes/academy-routes";
import { IPlayerHubProgress } from "@/core/entities/hub/IPlayerHubProgress";
import { OnboardingNarrationBeat } from "@/components/hub/onboarding/internal/OnboardingNarrationBeat";
import { savePlayerOnboardingAction } from "@/components/hub/onboarding/internal/save-player-onboarding-action";
import { resolveOnboardingVisibility } from "@/components/hub/onboarding/internal/resolve-onboarding-visibility";
import { useOnboardingAudio } from "@/components/hub/onboarding/internal/use-onboarding-audio";
import { CyberBackground } from "@/components/landing/CyberBackground";

type OnboardingStep = "BIGLOG_PRESENTATION" | "PLAYER_PRESENTATION" | "BIGLOG_DECISION";

interface IHubOnboardingIntroOverlayProps {
  progress?: IPlayerHubProgress;
}

interface IStepContent {
  actor: "biglog" | "player";
  label: string;
  text: string;
  cta?: string;
}

const STEP_ORDER: readonly OnboardingStep[] = ["BIGLOG_PRESENTATION", "PLAYER_PRESENTATION", "BIGLOG_DECISION"];

const STEP_CONTENT: Record<OnboardingStep, IStepContent> = {
  BIGLOG_PRESENTATION: {
    actor: "biglog",
    label: "BigLog",
    text: "Soy BigLog, oficial de enlace de Big Tech. Te mostraré la base del sistema: Market, Combate y Arsenal.",
    cta: "Siguiente",
  },
  PLAYER_PRESENTATION: {
    actor: "player",
    label: "Jugador",
    text: "Gracias, BigLog. Estoy preparado para entrar en esta lucha y dominar el núcleo del sistema.",
    cta: "Siguiente",
  },
  BIGLOG_DECISION: {
    actor: "biglog",
    label: "BigLog",
    text: "Vamos a Academy. Te enseñaré el flujo completo para que puedas operar con seguridad desde el primer combate.",
  },
};

function resolveActorImage(actor: "biglog" | "player"): string {
  return actor === "biglog" ? "/assets/story/opponents/opp-ch1-biglog/intro-BigLog.png" : "/assets/story/player/intro-Jugador.png";
}
function resolveActorSide(actor: "biglog" | "player"): "left" | "right" {
  return actor === "biglog" ? "right" : "left";
}

/**
 * Ejecuta onboarding narrativo y persiste decisión para desbloqueo de nodos del Hub.
 */
export function HubOnboardingIntroOverlay({ progress }: IHubOnboardingIntroOverlayProps) {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isRoutingToAcademy, setIsRoutingToAcademy] = useState(false);
  const shouldShow = resolveOnboardingVisibility(progress);
  const audio = useOnboardingAudio({ isEnabled: shouldShow && !isClosing });
  const step = STEP_ORDER[stepIndex] ?? STEP_ORDER[0];
  const content = STEP_CONTENT[step];

  useEffect(() => {
    if (!shouldShow || isClosing) return;
    audio.playStepMovement();
  }, [audio, isClosing, shouldShow, step]);

  if (!shouldShow || isClosing) return null;

  const moveNextStep = () => {
    audio.playButtonClick();
    setStepIndex((current) => Math.min(current + 1, STEP_ORDER.length - 1));
  };
  const executeAction = async (action: "mark_intro_seen" | "skip_tutorial") => {
    audio.playButtonClick();
    setIsLoading(true);
    try {
      await savePlayerOnboardingAction(action);
      if (action === "mark_intro_seen") {
        setIsRoutingToAcademy(true);
        await new Promise((resolve) => window.setTimeout(resolve, 700));
        router.push(ACADEMY_TUTORIAL_MAP_ROUTE);
        return;
      }
      setIsClosing(true);
      router.refresh();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="fixed inset-0 z-[180] overflow-hidden">
      <CyberBackground />
      <div className="relative z-10 flex h-full items-center justify-center p-4">
        {isRoutingToAcademy ? (
          <div className="rounded-xl border border-cyan-300/60 bg-cyan-950/45 px-6 py-4 text-center shadow-[0_0_36px_rgba(34,211,238,0.4)]">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-200">Conectando</p>
            <p className="mt-1 text-lg font-black uppercase tracking-[0.12em] text-cyan-50">Academy</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex w-full items-center justify-center">
              <OnboardingNarrationBeat
                actorName={content.label}
                actorImage={resolveActorImage(content.actor)}
                actorSide={resolveActorSide(content.actor)}
                text={content.text}
                actions={step !== "BIGLOG_DECISION" ? (
                  <button type="button" onClick={moveNextStep} className="rounded-md border border-black/60 px-4 py-2 text-xs font-black uppercase tracking-[0.14em]">
                    {content.cta}
                  </button>
                ) : (
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <button type="button" disabled={isLoading} onClick={() => void executeAction("mark_intro_seen")} className="rounded-md border border-cyan-400/60 bg-cyan-950/80 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-cyan-100 disabled:opacity-55">
                      Ir a Academy
                    </button>
                    <button type="button" disabled={isLoading} onClick={() => void executeAction("skip_tutorial")} className="rounded-md border border-amber-400/65 bg-amber-950/75 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-amber-100 disabled:opacity-55">
                      No, voy por mi cuenta
                    </button>
                  </div>
                )}
              />
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </section>
  );
}
