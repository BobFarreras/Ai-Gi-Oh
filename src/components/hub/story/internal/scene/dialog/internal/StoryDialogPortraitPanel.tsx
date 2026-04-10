// src/components/hub/story/internal/scene/dialog/internal/StoryDialogPortraitPanel.tsx - Panel de retrato narrativo con borde ciberpunk y barrido terminal opcional.
"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface IStoryDialogPortraitPanelProps {
  src: string;
  alt: string;
  side: "LEFT" | "RIGHT";
  terminalMode: boolean;
}

export function StoryDialogPortraitPanel({
  src,
  alt,
  side,
  terminalMode,
}: IStoryDialogPortraitPanelProps) {
  const sideClassName =
    side === "LEFT"
      ? "bottom-4 left-3 h-[208px] w-[162px] sm:bottom-6 sm:left-6 sm:h-[252px] sm:w-[196px]"
      : "right-3 top-2 h-[200px] w-[154px] sm:right-6 sm:top-6 sm:h-[242px] sm:w-[186px]";

  return (
    <motion.div
      initial={{ opacity: 0, x: side === "LEFT" ? -16 : 16, y: side === "LEFT" ? 20 : -20 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      className={cn(
        "pointer-events-none absolute z-10 overflow-hidden rounded-xl border bg-zinc-950/85 shadow-[0_0_28px_rgba(34,211,238,0.26)]",
        sideClassName,
        terminalMode ? "border-cyan-300/75" : "border-fuchsia-300/45",
      )}
    >
      <motion.div
        aria-hidden
        animate={terminalMode ? { opacity: [0.1, 0.3, 0.1] } : { opacity: 0 }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-0 z-10"
        style={{ backgroundImage: "linear-gradient(to bottom, rgba(34,211,238,0.15) 1px, transparent 1px)", backgroundSize: "100% 4px" }}
      />
      <Image src={src} alt={alt} fill sizes="196px" quality={60} className="object-cover object-top" />
    </motion.div>
  );
}
