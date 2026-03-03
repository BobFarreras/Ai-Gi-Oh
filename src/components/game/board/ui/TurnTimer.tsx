"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface TurnTimerProps {
  onTimeUp: () => void;
  onWarning?: () => void;
  isActive: boolean;
}

export function TurnTimer({ onTimeUp, onWarning, isActive }: TurnTimerProps) {
  const [timeLeft, setTimeLeft] = useState(30);

  useEffect(() => {
    if (!isActive) {
      return;
    }

    if (timeLeft <= 0) {
      const timeoutId = setTimeout(onTimeUp, 0);
      return () => clearTimeout(timeoutId);
    }

    if (timeLeft === 5 && onWarning) {
      const warningId = setTimeout(onWarning, 0);
      const intervalId = setInterval(() => setTimeLeft((value) => value - 1), 1000);
      return () => {
        clearTimeout(warningId);
        clearInterval(intervalId);
      };
    }

    const intervalId = setInterval(() => setTimeLeft((value) => value - 1), 1000);
    return () => clearInterval(intervalId);
  }, [isActive, timeLeft, onTimeUp, onWarning]);

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-3 py-1 rounded bg-black/50 border border-white/10 font-mono text-lg font-black tracking-widest transition-colors",
        timeLeft <= 10 ? "text-red-500 animate-pulse border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.5)]" : "text-cyan-400",
      )}
    >
      {isActive ? `00:${timeLeft < 10 ? `0${timeLeft}` : timeLeft}` : "--:--"}
    </div>
  );
}
