// src/components/game/board/ui/internal/use-duel-card-experience-animation.ts - Anima progreso de EXP del overlay nivel a nivel para cada carta.
"use client";

import { useEffect, useMemo, useState } from "react";
import { getCardLevelProgressMetrics, getXpRequiredForNextLevel, getTotalXpRequiredToReachLevel } from "@/core/services/progression/card-level-rules";

interface IUseDuelCardExperienceAnimationInput {
  oldLevel: number;
  newLevel: number;
  previousTotalXp: number;
  currentTotalXp: number;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function useDuelCardExperienceAnimation(input: IUseDuelCardExperienceAnimationInput) {
  const initialMetrics = useMemo(
    () => getCardLevelProgressMetrics(input.oldLevel, input.previousTotalXp),
    [input.oldLevel, input.previousTotalXp],
  );
  const targetMetrics = useMemo(
    () => getCardLevelProgressMetrics(input.newLevel, input.currentTotalXp),
    [input.currentTotalXp, input.newLevel],
  );
  const [displayLevel, setDisplayLevel] = useState(input.oldLevel);
  const [progressRatio, setProgressRatio] = useState(initialMetrics.progressRatio);
  const [levelUpPulseTick, setLevelUpPulseTick] = useState(0);

  useEffect(() => {
    let isCancelled = false;
    const animate = async () => {
      setDisplayLevel(input.oldLevel);
      setProgressRatio(initialMetrics.progressRatio);
      if (input.newLevel <= input.oldLevel) {
        await sleep(220);
        if (!isCancelled) setProgressRatio(targetMetrics.progressRatio);
        return;
      }
      let currentLevel = input.oldLevel;
      let cursorXp = input.previousTotalXp;
      while (!isCancelled && currentLevel < input.newLevel) {
        const totalAtLevel = getTotalXpRequiredToReachLevel(currentLevel);
        const xpRequired = getXpRequiredForNextLevel(currentLevel);
        const consumedInLevel = Math.max(0, cursorXp - totalAtLevel);
        const toNextLevel = Math.max(0, xpRequired - consumedInLevel);
        setProgressRatio(1);
        await sleep(1000);
        if (isCancelled) return;
        setDisplayLevel((previous) => previous + 1);
        setLevelUpPulseTick((previous) => previous + 1);
        currentLevel += 1;
        cursorXp += toNextLevel;
        setProgressRatio(0);
        await sleep(300);
      }
      if (!isCancelled) {
        setProgressRatio(targetMetrics.progressRatio);
      }
    };
    void animate();
    return () => {
      isCancelled = true;
    };
  }, [initialMetrics.progressRatio, input.currentTotalXp, input.newLevel, input.oldLevel, input.previousTotalXp, targetMetrics.progressRatio]);

  return {
    displayLevel,
    progressPercent: Math.round(progressRatio * 100),
    levelUpPulseTick,
  };
}
