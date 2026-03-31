// src/components/game/board/ui/overlays/internal/DirectDamageBeamOverlay.tsx - Overlay global de rayo de daño directo sincronizado con posición de carta origen.
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ICombatLogEvent } from "@/core/entities/ICombatLog";
import { DIRECT_DAMAGE_BEAM_MS, DIRECT_DAMAGE_BEAM_START_MS } from "@/core/config/direct-damage-vfx";
import { IPoint, ITrajectory, resolveFallbackTrajectory, resolveLatestEffectDamageSignal, resolveSourceFromBoard } from "./direct-damage-beam-overlay-logic";

interface IDirectDamageBeamOverlayProps { events: ICombatLogEvent[]; playerAId: string; }

function play(path: string, volume: number): void {
  if (typeof window === "undefined" || typeof window.Audio === "undefined") return;
  const audio = new Audio(path);
  audio.preload = "auto";
  audio.loop = false;
  audio.volume = Math.max(0, Math.min(1, volume));
  const result = audio.play();
  if (result && typeof result.catch === "function") result.catch(() => undefined);
}

export function DirectDamageBeamOverlay({ events, playerAId }: IDirectDamageBeamOverlayProps) {
  const signal = resolveLatestEffectDamageSignal(events, playerAId);
  const signalId = signal?.id ?? null;
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const [sourcePoint, setSourcePoint] = useState<IPoint | null>(null);
  const fallbackTrajectory = useMemo(() => (signal ? resolveFallbackTrajectory(signal.towardsPlayer, signal.fromPlayerA) : null), [signal]);

  useEffect(() => {
    if (!signalId) return;
    const startDelay = signal?.startDelayMs ?? 0;
    const beamTimer = window.setTimeout(() => play("/audio/sfx/damage.mp3", 0.82), startDelay + DIRECT_DAMAGE_BEAM_START_MS);
    const impactTimer = window.setTimeout(() => play("/audio/sfx/damage.mp3", 0.64), startDelay + DIRECT_DAMAGE_BEAM_START_MS + DIRECT_DAMAGE_BEAM_MS);
    return () => {
      window.clearTimeout(beamTimer);
      window.clearTimeout(impactTimer);
    };
  }, [signalId, signal?.startDelayMs]);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      if (!signal?.sourceCardId || !overlayRef.current) {
        setSourcePoint(null);
        return;
      }
      setSourcePoint(resolveSourceFromBoard(overlayRef.current, signal.sourceCardId, signal.fromPlayerA));
    });
    return () => window.cancelAnimationFrame(frameId);
  }, [signalId, signal?.sourceCardId, signal?.fromPlayerA]);

  if (!signal || !fallbackTrajectory) return null;

  const trajectory: ITrajectory = sourcePoint
    ? {
      source: sourcePoint,
      target: fallbackTrajectory.target,
      control: {
        x: (sourcePoint.x + fallbackTrajectory.target.x) / 2 + (signal.towardsPlayer ? -28 : 28),
        y: (sourcePoint.y + fallbackTrajectory.target.y) / 2 + (signal.towardsPlayer ? 42 : -42),
      },
    }
    : fallbackTrajectory;
  const beamPath = `M ${trajectory.source.x} ${trajectory.source.y} Q ${trajectory.control.x} ${trajectory.control.y} ${trajectory.target.x} ${trajectory.target.y}`;

  return (
    <div ref={overlayRef} key={signal.id} className="pointer-events-none absolute inset-0 z-[360] overflow-hidden">
      {Array.from({ length: 6 }).map((_, index) => (
        <motion.div
          key={`smoke-${index}`}
          initial={{ opacity: 0, y: 8, scale: 0.8 }}
          animate={{ opacity: [0, 0.8, 0], y: [8, -30, -58], scale: [0.8, 1.15, 1.42] }}
          transition={{ duration: 0.28 + index * 0.03, delay: index * 0.05, ease: "easeOut" }}
          className="absolute left-1/2 top-1/2 h-10 w-7 rounded-full bg-gradient-to-t from-amber-500/70 via-orange-300/70 to-slate-100/45 blur-md"
          style={{ x: trajectory.source.x - 510 + (index % 3) * 10, y: trajectory.source.y - 510 + Math.floor(index / 3) * 10 }}
        />
      ))}
      <motion.div
        initial={{ opacity: 0, scale: 0.8, x: trajectory.source.x - 500, y: trajectory.source.y - 500 }}
        animate={{ opacity: [0, 1, 0], scale: [0.8, 1.2, 0.95] }}
        transition={{ duration: DIRECT_DAMAGE_BEAM_START_MS / 1000, delay: (signal.startDelayMs ?? 0) / 1000, ease: "easeOut" }}
        className="absolute left-1/2 top-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-red-400/80 via-orange-200/90 to-cyan-200/80 blur-sm"
      />
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1000 1000" preserveAspectRatio="none">
        <motion.path d={beamPath} fill="none" stroke="rgba(254,242,242,0.96)" strokeWidth={9} strokeLinecap="round" initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: [0, 1], opacity: [0, 1, 0] }} transition={{ duration: DIRECT_DAMAGE_BEAM_MS / 1000, delay: (signal.startDelayMs + DIRECT_DAMAGE_BEAM_START_MS) / 1000, ease: "easeInOut" }} style={{ filter: "drop-shadow(0 0 16px rgba(239,68,68,0.95)) drop-shadow(0 0 24px rgba(34,211,238,0.66))" }} />
        <motion.path d={beamPath} fill="none" stroke="rgba(248,113,113,0.72)" strokeWidth={16} strokeLinecap="round" initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: [0, 1], opacity: [0, 0.85, 0] }} transition={{ duration: DIRECT_DAMAGE_BEAM_MS / 1000, delay: (signal.startDelayMs + DIRECT_DAMAGE_BEAM_START_MS) / 1000, ease: "easeInOut" }} style={{ filter: "blur(1.2px)" }} />
      </svg>
    </div>
  );
}
