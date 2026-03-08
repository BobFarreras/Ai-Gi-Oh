// src/components/game/board/internal/HudDialogueBubble.tsx - Burbuja de diálogo contextual del HUD anclada al lado del retrato activo.
"use client";

import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface HudDialogueBubbleProps {
  isOpponent: boolean;
  message: string | null;
}

export function HudDialogueBubble({ isOpponent, message }: HudDialogueBubbleProps) {
  return (
    <AnimatePresence mode="wait">
      {message ? (
        <motion.div
          key={message}
          initial={{ opacity: 0, y: isOpponent ? 14 : -14, scale: 0.88 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: isOpponent ? 8 : -8, scale: 0.94 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className={cn(
            "absolute z-[120] max-w-[280px] rounded-2xl border-[3px] border-zinc-950 bg-white px-4 py-3 text-sm font-black tracking-tight text-zinc-900 shadow-[5px_5px_0_rgba(0,0,0,0.85)]",
            isOpponent ? "right-8 top-[145px]" : "left-8 -top-[98px]",
          )}
        >
          {message}

          <span className={cn("absolute left-10 h-4 w-4 rotate-45 border-zinc-950 bg-white", isOpponent ? "-top-[9.5px] border-l-[3px] border-t-[3px]" : "-bottom-[9.5px] border-r-[3px] border-b-[3px]")} />
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
