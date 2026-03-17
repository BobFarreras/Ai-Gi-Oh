// src/components/game/board/internal/BoardTutorialGuide.tsx - Overlay guiado del tutorial con secuencia dinámica basada en estado real del duelo.
"use client";
import { useMemo, useState } from "react";
import { ICombatLogEvent } from "@/core/entities/ICombatLog";
import { resolveTutorialGuideSteps } from "@/components/game/board/internal/tutorial/tutorial-step-state";

interface IBoardTutorialGuideProps {
  combatLog: ICombatLogEvent[];
  selectedCard: boolean;
  isGraveyardOpen: boolean;
  isCombatLogOpen: boolean;
  hasReviveInteraction: boolean;
  hasWinner: boolean;
}

/**
 * Detecta si el tutorial ya generó un evento clave dentro del log de combate.
 */
function hasEvent(events: ICombatLogEvent[], eventType: ICombatLogEvent["eventType"]): boolean {
  return events.some((event) => event.eventType === eventType);
}

/**
 * Revisa si el jugador usó un tipo de carta específico para marcar avance de paso.
 */
function hasCardPlayedType(events: ICombatLogEvent[], cardType: string): boolean {
  return events.some((event) => event.eventType === "CARD_PLAYED" && event.payload.cardType === cardType);
}

export function BoardTutorialGuide(props: IBoardTutorialGuideProps) {
  const [ackedStepIds, setAckedStepIds] = useState<Set<string>>(new Set());
  const steps = useMemo(
    () =>
      resolveTutorialGuideSteps(
        {
          turn: 1,
          selectedCard: props.selectedCard,
          hasPlayedEntity: hasCardPlayedType(props.combatLog, "ENTITY"),
          hasBattleResolved: hasEvent(props.combatLog, "BATTLE_RESOLVED") || hasEvent(props.combatLog, "DIRECT_DAMAGE"),
          hasPlayedExecution: hasCardPlayedType(props.combatLog, "EXECUTION"),
          hasFusionSummon: hasEvent(props.combatLog, "FUSION_SUMMONED"),
          isGraveyardOpen: props.isGraveyardOpen,
          hasReviveInteraction: props.hasReviveInteraction,
          isCombatLogOpen: props.isCombatLogOpen,
          hasWinner: props.hasWinner,
        },
        ackedStepIds,
      ),
    [ackedStepIds, props.combatLog, props.hasReviveInteraction, props.hasWinner, props.isCombatLogOpen, props.isGraveyardOpen, props.selectedCard],
  );
  const currentStep = steps.find((step) => !step.isCompleted) ?? null;

  return (
    <aside className="pointer-events-none absolute right-3 top-3 z-[320] w-[min(92vw,420px)] rounded-xl border border-cyan-300/35 bg-slate-950/88 p-3 text-cyan-100 shadow-[0_8px_28px_rgba(0,0,0,0.45)]">
      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-300/90">Tutorial Dinamico</p>
      <p className="mt-1 text-sm font-black uppercase">{currentStep?.title ?? "Tutorial completado"}</p>
      <p className="mt-1 text-xs text-cyan-100/90">{currentStep?.description ?? "Has cubierto todas las mecánicas principales del combate."}</p>
      <div className="mt-2 flex flex-wrap gap-1">
        {steps.map((step) => (
          <span key={step.id} className={`rounded px-2 py-0.5 text-[10px] font-bold ${step.isCompleted ? "bg-emerald-400/25 text-emerald-100" : "bg-slate-800/70 text-slate-300"}`}>
            {step.isCompleted ? "OK" : "..."} {step.title}
          </span>
        ))}
      </div>
      {currentStep?.requiresAck && !currentStep.isCompleted ? (
        <button
          type="button"
          onClick={() => setAckedStepIds((previous) => new Set(previous).add(currentStep.id))}
          className="pointer-events-auto mt-2 rounded border border-cyan-200/40 px-2 py-1 text-[11px] font-black uppercase text-cyan-100 hover:bg-cyan-300/10"
          aria-label={`Confirmar paso ${currentStep.title}`}
        >
          Entendido
        </button>
      ) : null}
    </aside>
  );
}
