// src/components/game/board/ui/overlays/internal/effect-targeted-overlay-runtime.ts - Gestiona cola de señales y resolución de puntos para overlay de efectos dirigidos.
import { RefObject, useEffect, useRef, useState } from "react";
import { ICombatLogEvent } from "@/core/entities/ICombatLog";
import { IPoint, resolveFallbackTrajectory, resolveSourceFromBoard } from "./direct-damage-beam-overlay-logic";
import { ITargetedStatSignal, ITrapBlockSignal, resolveStatSignalAt, resolveTrapBlockSignalAt } from "./effect-targeted-overlay-logic";

export type OverlaySignal =
  | { kind: "TRAP"; payload: ITrapBlockSignal }
  | { kind: "STAT"; payload: ITargetedStatSignal };

function findEntityPoint(root: HTMLDivElement, instanceId: string): IPoint | null {
  const node = document.querySelector<HTMLElement>(`[data-board-entity-instance-id="${instanceId}"]`);
  if (!node) return null;
  const rootRect = root.getBoundingClientRect();
  const rect = node.getBoundingClientRect();
  return { x: ((rect.left + rect.width / 2 - rootRect.left) / Math.max(rootRect.width, 1)) * 1000, y: ((rect.top + rect.height / 2 - rootRect.top) / Math.max(rootRect.height, 1)) * 1000 };
}

function findSlotPoint(root: HTMLDivElement, isOpponentSide: boolean, laneType: "ENTITIES" | "EXECUTIONS", slotIndex: number): IPoint | null {
  const node = root.querySelector<HTMLElement>(
    `[data-board-slot-side="${isOpponentSide ? "opponent" : "player"}"][data-board-lane-type="${laneType}"][data-slot-index="${slotIndex}"]`,
  );
  if (!node) return null;
  const rootRect = root.getBoundingClientRect();
  const rect = node.getBoundingClientRect();
  return { x: ((rect.left + rect.width / 2 - rootRect.left) / Math.max(rootRect.width, 1)) * 1000, y: ((rect.top + rect.height / 2 - rootRect.top) / Math.max(rootRect.height, 1)) * 1000 };
}

export function useQueuedOverlaySignal(events: ICombatLogEvent[], playerAId: string): OverlaySignal | null {
  const processedEventIndexRef = useRef(0);
  const [queuedSignals, setQueuedSignals] = useState<OverlaySignal[]>([]);
  const [activeSignal, setActiveSignal] = useState<OverlaySignal | null>(null);

  useEffect(() => {
    const startIndex = processedEventIndexRef.current;
    if (events.length <= startIndex) return;
    const nextSignals: OverlaySignal[] = [];
    for (let index = startIndex; index < events.length; index += 1) {
      const trapSignal = resolveTrapBlockSignalAt(events, index, playerAId);
      if (trapSignal) {
        nextSignals.push({ kind: "TRAP", payload: trapSignal });
        continue;
      }
      const statSignal = resolveStatSignalAt(events, index, playerAId);
      if (statSignal) nextSignals.push({ kind: "STAT", payload: statSignal });
    }
    processedEventIndexRef.current = events.length;
    if (nextSignals.length === 0) return;
    const timer = window.setTimeout(() => setQueuedSignals((previous) => [...previous, ...nextSignals]), 0);
    return () => window.clearTimeout(timer);
  }, [events, playerAId]);

  useEffect(() => {
    if (activeSignal || queuedSignals.length === 0) return;
    const timer = window.setTimeout(() => {
      setActiveSignal(queuedSignals[0]);
      setQueuedSignals((previous) => previous.slice(1));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [activeSignal, queuedSignals]);

  useEffect(() => {
    if (!activeSignal) return;
    const durationMs = activeSignal.kind === "TRAP" ? 980 : 1240;
    const timer = window.setTimeout(() => setActiveSignal(null), durationMs);
    return () => window.clearTimeout(timer);
  }, [activeSignal]);

  return activeSignal;
}

export function useStatSignalPoints(overlayRef: RefObject<HTMLDivElement | null>, activeSignal: OverlaySignal | null) {
  const [statTargetPoints, setStatTargetPoints] = useState<IPoint[]>([]);
  const [statSourcePoint, setStatSourcePoint] = useState<IPoint | null>(null);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      if (!overlayRef.current || !activeSignal || activeSignal.kind !== "STAT") {
        setStatSourcePoint(null);
        setStatTargetPoints([]);
        return;
      }
      const statSignal = activeSignal.payload;
      const source = statSignal.sourceCardId
        ? resolveSourceFromBoard(overlayRef.current, statSignal.sourceCardId, statSignal.actorIsPlayerA)
        : resolveFallbackTrajectory(false, statSignal.actorIsPlayerA).source;
      const targets = statSignal.targetEntityIds.map((entityId) => findEntityPoint(overlayRef.current as HTMLDivElement, entityId)).filter((value): value is IPoint => value !== null);
      setStatSourcePoint(source);
      setStatTargetPoints(targets);
    });
    return () => window.cancelAnimationFrame(frameId);
  }, [activeSignal, overlayRef]);

  return { statSourcePoint, statTargetPoints };
}

export function useTrapSignalPoints(overlayRef: RefObject<HTMLDivElement | null>, activeSignal: OverlaySignal | null) {
  const [trapTargetPoint, setTrapTargetPoint] = useState<IPoint | null>(null);
  const [trapSourcePoint, setTrapSourcePoint] = useState<IPoint | null>(null);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      if (!overlayRef.current || !activeSignal || activeSignal.kind !== "TRAP") {
        setTrapSourcePoint(null);
        setTrapTargetPoint(null);
        return;
      }
      const trapSignal = activeSignal.payload;
      const source = resolveSourceFromBoard(overlayRef.current, trapSignal.trapCardId, trapSignal.actorIsPlayerA)
        ?? findSlotPoint(overlayRef.current, !trapSignal.actorIsPlayerA, "EXECUTIONS", trapSignal.trapSlotIndex)
        ?? resolveFallbackTrajectory(false, trapSignal.actorIsPlayerA).source;
      const targetId = trapSignal.blockedTargetEntityInstanceId ?? trapSignal.destroyedTargetEntityInstanceId;
      const target = targetId
        ? findEntityPoint(overlayRef.current, targetId)
        : trapSignal.destroyedTargetEntitySlotIndex !== null
          ? findSlotPoint(overlayRef.current, !trapSignal.targetIsPlayerA, "ENTITIES", trapSignal.destroyedTargetEntitySlotIndex)
          : null;
      setTrapSourcePoint(source);
      setTrapTargetPoint(target);
    });
    return () => window.cancelAnimationFrame(frameId);
  }, [activeSignal, overlayRef]);

  return { trapSourcePoint, trapTargetPoint };
}
