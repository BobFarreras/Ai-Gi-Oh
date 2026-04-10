// src/components/game/board/battlefield/internal/useStickySlotEntity.ts - Mantiene temporalmente cartas de ejecución/trampa al salir del slot para sincronizar VFX antes del cementerio.
"use client";

import { useEffect, useRef, useState } from "react";
import { IBoardEntity } from "@/core/entities/IPlayer";

interface IStickySlotEntityResult {
  entity: IBoardEntity | null;
  isSticky: boolean;
}

/**
 * Evita desaparición instantánea de cartas al salir del slot para permitir que su VFX termine.
 */
export function useStickySlotEntity(
  laneType: "ENTITIES" | "EXECUTIONS",
  entity: IBoardEntity | null,
  stickyMs = laneType === "ENTITIES" ? 1600 : 1200,
): IStickySlotEntityResult {
  const [stickyEntity, setStickyEntity] = useState<IBoardEntity | null>(entity);
  const [isSticky, setIsSticky] = useState(false);
  const previousRef = useRef<IBoardEntity | null>(entity);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    const previous = previousRef.current;
    if (entity) {
      previousRef.current = entity;
      const timerId = window.setTimeout(() => {
        setStickyEntity(entity);
        setIsSticky(false);
      }, 0);
      return () => window.clearTimeout(timerId);
    }

    const canStickExecution = laneType === "EXECUTIONS"
      && Boolean(previous)
      && (previous?.mode === "ACTIVATE" || previous?.card.type === "TRAP");
    const canStickDestroyedEntity = laneType === "ENTITIES" && Boolean(previous);
    const canStick = canStickExecution || canStickDestroyedEntity;

    if (!canStick) {
      previousRef.current = null;
      const timerId = window.setTimeout(() => {
        setStickyEntity(null);
        setIsSticky(false);
      }, 0);
      return () => window.clearTimeout(timerId);
    }

    const beginTimerId = window.setTimeout(() => {
      setStickyEntity(previous);
      setIsSticky(true);
    }, 0);
    timerRef.current = window.setTimeout(() => {
      setStickyEntity(null);
      setIsSticky(false);
      previousRef.current = null;
    }, stickyMs);
    return () => {
      window.clearTimeout(beginTimerId);
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [entity, laneType, stickyMs]);

  useEffect(() => () => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
  }, []);

  return { entity: stickyEntity, isSticky };
}
