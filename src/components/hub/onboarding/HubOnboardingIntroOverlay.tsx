// src/components/hub/onboarding/HubOnboardingIntroOverlay.tsx - Secuencia narrativa inicial de Academy con decisión guiada o salto libre.
"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { IPlayerHubProgress } from "@/core/entities/hub/IPlayerHubProgress";
import { OnboardingNarrationBeat } from "@/components/hub/onboarding/internal/OnboardingNarrationBeat";
import { savePlayerOnboardingAction } from "@/components/hub/onboarding/internal/save-player-onboarding-action";
import { resolveOnboardingVisibility } from "@/components/hub/onboarding/internal/resolve-onboarding-visibility";
import { useOnboardingAudio } from "@/components/hub/onboarding/internal/use-onboarding-audio";
import { CyberBackground } from "@/components/landing/CyberBackground";

type OnboardingStep = "CONTEXT_SYSTEM" | "CONTEXT_CONFLICT" | "CONTEXT_THREAT" | "PLAYER_READY" | "BIGLOG_DECISION";

interface IHubOnboardingIntroOverlayProps {
  progress?: IPlayerHubProgress;
}

interface IStepContent {
  actor: "biglog" | "player";
  label: string;
  text: string;
  cta?: string;
}

const STEP_ORDER: readonly OnboardingStep[] = [
  "CONTEXT_SYSTEM",
  "CONTEXT_CONFLICT",
  "CONTEXT_THREAT",
  "PLAYER_READY",
  "BIGLOG_DECISION",
];

const STEP_CONTENT: Record<OnboardingStep, IStepContent> = {
  CONTEXT_SYSTEM: {
    actor: "biglog",
    label: "BigLog",
    text: "Bienvenido, operador. Soy BigLog, oficial de enlace de Big Tech. Este núcleo es lo último que queda de una red global que una vez conectó toda la información del mundo.",
    cta: "Siguiente",
  },
  CONTEXT_CONFLICT: {
    actor: "biglog",
    label: "BigLog",
    text: "La Entidad ha tomado el control. Reescribe reglas, corrompe sistemas y bloquea el acceso a quienes no demuestren su valor en combate.",
    cta: "Siguiente",
  },
  CONTEXT_THREAT: {
    actor: "biglog",
    label: "BigLog",
    text: "Tu misión es clara: dominar el Mercado para conseguir recursos, montar tu Arsenal con cartas y fusiones, y enfrentarte a la Entidad en el Archivo de Historia.",
    cta: "Siguiente",
  },
  PLAYER_READY: {
    actor: "player",
    label: "Jugador",
    text: "Entendido, BigLog. No solo quiero sobrevivir: quiero desbloquear el núcleo y devolver el control.",
    cta: "Siguiente",
  },
  BIGLOG_DECISION: {
    actor: "biglog",
    label: "BigLog",
    text: "Vamos al Hub. Te enseñaré el flujo completo para que puedas operar con seguridad desde el primer combate.",
  },
};

function resolveActorImage(actor: "biglog" | "player"): string {
  return actor === "biglog" ? "/assets/story/opponents/opp-ch1-biglog/intro-BigLog.webp" : "/assets/story/player/intro-Jugador.webp";
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
  const [isRoutingToHub, setIsRoutingToHub] = useState(false);
  const [isSkipConfirmed, setIsSkipConfirmed] = useState(false);
  const shouldShow = resolveOnboardingVisibility(progress);
  const audio = useOnboardingAudio({ isEnabled: shouldShow });
  const step = STEP_ORDER[stepIndex] ?? STEP_ORDER[0];
  const content = STEP_CONTENT[step];

  useEffect(() => {
    if (!shouldShow) return;
    audio.playStepMovement();
  }, [audio, shouldShow, step]);

  if (!shouldShow) return null;

  if (isSkipConfirmed) {
    return (
      <section className="fixed inset-0 z-[180] overflow-hidden">
        <CyberBackground lightweight />
        <div className="relative z-10 flex h-full items-center justify-center p-4">
          <div className="rounded-xl border border-amber-300/60 bg-amber-950/45 px-6 py-4 text-center shadow-[0_0_36px_rgba(245,158,11,0.4)]">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-200">Hub activado</p>
            <p className="mt-1 text-lg font-black uppercase tracking-[0.12em] text-amber-50">Acceso completo</p>
            <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-200/70">Todos los nodos disponibles</p>
          </div>
        </div>
      </section>
    );
  }

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
        setIsRoutingToHub(true);
        await new Promise((resolve) => window.setTimeout(resolve, 700));
        router.refresh();
        return;
      }
      setIsSkipConfirmed(true);
      await new Promise((resolve) => window.setTimeout(resolve, 1200));
      window.location.assign("/hub");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="fixed inset-0 z-[180] overflow-hidden">
      <CyberBackground lightweight />
      <div className="relative z-10 flex h-full items-center justify-center p-4">
        {isRoutingToHub ? (
          <div className="rounded-xl border border-cyan-300/60 bg-cyan-950/45 px-6 py-4 text-center shadow-[0_0_36px_rgba(34,211,238,0.4)]">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-200">Sincronizando</p>
            <p className="mt-1 text-lg font-black uppercase tracking-[0.12em] text-cyan-50">Hub</p>
          </div>
        ) : (
          <div className="flex w-full items-center justify-center">
              <OnboardingNarrationBeat
                actorName={content.label}
                actorImage={resolveActorImage(content.actor)}
                actorSide={resolveActorSide(content.actor)}
                text={content.text}
                imageKey={content.actor}
                textKey={step}
                actions={step !== "BIGLOG_DECISION" ? (
                  <button type="button" onClick={moveNextStep} className="rounded-md border border-black/60 px-4 py-2 text-xs font-black uppercase tracking-[0.14em]">
                    {content.cta}
                  </button>
                ) : (
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <button type="button" disabled={isLoading} onClick={() => void executeAction("mark_intro_seen")} className="rounded-md border border-cyan-400/60 bg-cyan-950/80 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-cyan-100 disabled:opacity-55">
                      Ir al Hub
                    </button>
                    <button type="button" disabled={isLoading} onClick={() => void executeAction("skip_tutorial")} className="rounded-md border border-amber-400/65 bg-amber-950/75 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-amber-100 disabled:opacity-55">
                      No, voy por mi cuenta
                    </button>
                  </div>
                )}
              />
          </div>
        )}
      </div>
    </section>
  );
}
