// src/components/hub/HubProgressSection.tsx - Widget HUD con métricas de progreso del arquitecto en el hub.
"use client";

import { useState } from "react";
import { BookOpen, Medal, ShieldCheck } from "lucide-react";
import { IPlayerHubProgress } from "@/core/entities/hub/IPlayerHubProgress";

interface IProgressItemProps {
  label: string;
  value: string | number;
  icon: "medal" | "chapter" | "tutorial";
  tone: "amber" | "cyan" | "emerald" | "orange";
}

function ProgressItem({ label, value, icon, tone }: IProgressItemProps) {
  const iconClass =
    tone === "amber"
      ? "text-amber-200"
      : tone === "cyan"
        ? "text-cyan-200"
        : tone === "emerald"
          ? "text-emerald-200"
          : "text-orange-200";
  const toneClass =
    tone === "amber"
      ? "border-amber-500/30 bg-amber-950/20"
      : tone === "cyan"
        ? "border-cyan-500/30 bg-cyan-950/20"
        : tone === "emerald"
          ? "border-emerald-500/30 bg-emerald-950/20"
          : "border-orange-500/30 bg-orange-950/20";
  const valueClass =
    tone === "amber"
      ? "text-amber-300"
      : tone === "cyan"
        ? "text-cyan-200"
        : tone === "emerald"
          ? "text-emerald-300"
          : "text-orange-300";
  const Icon = icon === "medal" ? Medal : icon === "chapter" ? BookOpen : ShieldCheck;

  return (
    <div className={`flex items-center gap-1 rounded-sm border px-1.5 py-1 shadow-[inset_0_0_15px_rgba(0,0,0,0.2)] sm:gap-2 sm:px-2 ${toneClass}`}>
      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm border border-white/10 bg-black/30 sm:h-10 sm:w-10">
        <Icon className={`h-3.5 w-3.5 animate-pulse sm:h-5 sm:w-5 ${iconClass}`} />
      </div>
      <div className="flex flex-col text-left">
        <span className="font-mono text-[6px] uppercase tracking-[0.12em] text-white/60 sm:text-[8px] sm:tracking-widest">{label}</span>
        <span className={`font-mono text-[11px] font-black leading-tight sm:text-base ${valueClass}`}>{value}</span>
      </div>
    </div>
  );
}

interface HubProgressSectionProps {
  progress: IPlayerHubProgress;
  onToggleSound?: () => void;
}

export function HubProgressSection({ progress, onToggleSound }: HubProgressSectionProps) {
  const tutorialTone = progress.hasCompletedTutorial ? "emerald" : "orange";
  const tutorialValue = progress.hasCompletedTutorial ? "Listo" : "Pendiente";
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <section
      className="group relative mx-auto flex w-[92vw] max-w-[640px] flex-col items-center justify-center border border-cyan-500/40 bg-[#010a14]/90 px-2 py-2 shadow-[0_15px_40px_rgba(6,182,212,0.15)] backdrop-blur-md transition-all hover:border-cyan-400/80 hover:bg-[#021224]/95 sm:w-[600px] sm:px-4"
      style={{ clipPath: "polygon(15px 0, calc(100% - 15px) 0, 100% 15px, 100% calc(100% - 15px), calc(100% - 15px) 100%, 15px 100%, 0 calc(100% - 15px), 0 15px)" }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.3)_50%)] bg-[length:100%_4px] opacity-40" />
      <div className="absolute top-0 left-1/2 h-1 w-24 sm:w-32 -translate-x-1/2 bg-cyan-400 shadow-[0_0_20px_rgba(6,182,212,1)]" />
      <button
        type="button"
        aria-label={isCollapsed ? "Expandir estado del arquitecto" : "Contraer estado del arquitecto"}
        onClick={() => {
          onToggleSound?.();
          setIsCollapsed((previous) => !previous);
        }}
        className="relative z-10 flex w-full items-center justify-between border-b border-cyan-900/60 px-2 pb-1"
      >
        <div className="flex gap-1"><div className="h-1 w-3 sm:w-4 bg-cyan-500/50" /><div className="h-1 w-1 bg-cyan-500/50" /></div>
        <p className="font-mono text-[8px] sm:text-[9px] font-black uppercase tracking-[0.3em] text-cyan-400">Estado del Arquitecto</p>
        <div className="flex items-center gap-1">
          <div className="h-1 w-1 bg-cyan-500/50" />
          <div className="h-1 w-3 sm:w-4 bg-cyan-500/50" />
          <span className="font-mono text-[10px] text-cyan-300">{isCollapsed ? "+" : "-"}</span>
        </div>
      </button>
      {!isCollapsed ? (
        <div className="relative z-10 mt-1.5 grid w-full grid-cols-3 gap-1 px-1 sm:gap-2">
        <ProgressItem label="Medallas" value={progress.medals} icon="medal" tone="amber" />
        <ProgressItem label="Capítulo" value={progress.storyChapter} icon="chapter" tone="cyan" />
        <ProgressItem label="Tutorial" value={tutorialValue} icon="tutorial" tone={tutorialTone} />
        </div>
      ) : null}
    </section>
  );
}
