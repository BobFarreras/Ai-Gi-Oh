import { MutableRefObject, useCallback, useEffect, useRef } from "react";
import { ICombatLogEvent } from "@/core/entities/ICombatLog";

interface UseGameAudioParams {
  combatLog: ICombatLogEvent[];
  winnerPlayerId: string | null;
  playerAId: string;
  playerBId: string;
}

function beep(context: AudioContext, frequency: number, duration: number, type: OscillatorType, gain = 0.04): void {
  const oscillator = context.createOscillator();
  const nodeGain = context.createGain();
  oscillator.type = type;
  oscillator.frequency.value = frequency;
  nodeGain.gain.value = gain;
  oscillator.connect(nodeGain);
  nodeGain.connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + duration);
}

function ensureContext(ref: MutableRefObject<AudioContext | null>): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AudioConstructor = window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioConstructor) return null;
  if (!ref.current) {
    ref.current = new AudioConstructor();
  }
  if (ref.current.state === "suspended") {
    void ref.current.resume();
  }
  return ref.current;
}

export function useGameAudio({ combatLog, winnerPlayerId, playerAId, playerBId }: UseGameAudioParams) {
  const contextRef = useRef<AudioContext | null>(null);
  const processedRef = useRef(0);
  const soundtrackRef = useRef<number | null>(null);

  useEffect(() => {
    const boot = () => ensureContext(contextRef);
    window.addEventListener("pointerdown", boot, { once: true });
    return () => window.removeEventListener("pointerdown", boot);
  }, []);

  useEffect(() => {
    const context = ensureContext(contextRef);
    if (!context || soundtrackRef.current !== null) return;
    soundtrackRef.current = window.setInterval(() => {
      beep(context, 120, 0.15, "triangle", 0.015);
      setTimeout(() => beep(context, 160, 0.12, "triangle", 0.012), 180);
    }, 2600);
    return () => {
      if (soundtrackRef.current !== null) {
        window.clearInterval(soundtrackRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const context = ensureContext(contextRef);
    if (!context) return;
    const nextEvents = combatLog.slice(processedRef.current);
    processedRef.current = combatLog.length;
    for (const event of nextEvents) {
      if (event.eventType === "TURN_STARTED") beep(context, 320, 0.12, "sine");
      if (event.eventType === "PHASE_CHANGED") beep(context, 440, 0.1, "triangle");
      if (event.eventType === "CARD_PLAYED") beep(context, 260, 0.08, "square");
      if (event.eventType === "DIRECT_DAMAGE") beep(context, 180, 0.14, "sawtooth");
      if (event.eventType === "FUSION_SUMMONED") {
        beep(context, 380, 0.1, "triangle");
        setTimeout(() => beep(context, 520, 0.14, "triangle"), 120);
      }
    }
  }, [combatLog]);

  useEffect(() => {
    const context = ensureContext(contextRef);
    if (!context || !winnerPlayerId) return;
    if (winnerPlayerId === "DRAW") {
      beep(context, 260, 0.15, "sine");
      setTimeout(() => beep(context, 220, 0.2, "sine"), 170);
      return;
    }
    const isPlayerWin = winnerPlayerId === playerAId;
    beep(context, isPlayerWin ? 520 : 180, 0.16, "triangle", 0.06);
    setTimeout(() => beep(context, isPlayerWin ? 660 : 140, 0.24, "triangle", 0.05), 180);
  }, [playerAId, playerBId, winnerPlayerId]);

  const playTimerExpired = useCallback(() => {
    const context = ensureContext(contextRef);
    if (!context) return;
    beep(context, 130, 0.18, "sawtooth", 0.06);
  }, []);

  return { playTimerExpired };
}
