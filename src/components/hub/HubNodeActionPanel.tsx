// src/components/hub/HubNodeActionPanel.tsx - Panel HTML accesible para nodos 3D con navegación o estado bloqueado.
"use client";

import { useState } from "react";
import { IHubSection } from "@/core/entities/hub/IHubSection";

interface HubNodeActionPanelProps {
  section: IHubSection;
  baseColor: string;
  onNavigate: (href: string) => void;
}

export function HubNodeActionPanel({ section, baseColor, onNavigate }: HubNodeActionPanelProps) {
  const [isLockReasonVisible, setIsLockReasonVisible] = useState(false);
  const isLocked = section.isLocked;

  const handleAction = () => {
    if (isLocked) {
      setIsLockReasonVisible((previous) => !previous);
      return;
    }
    onNavigate(section.href);
  };

  return (
    <button
      type="button"
      aria-label={isLocked ? `Mostrar bloqueo de ${section.title}` : `Abrir ${section.title}`}
      onClick={handleAction}
      className={`flex w-[220px] cursor-pointer flex-col items-center justify-center border bg-[#030914]/80 py-3 shadow-lg backdrop-blur-md transition-all hover:scale-105 hover:bg-[#051124]/90
        ${isLocked ? "border-red-500/30 hover:border-red-400/80" : "border-slate-600/30 hover:border-white/50"}
      `}
      style={{ clipPath: "polygon(0 0, 85% 0, 100% 15px, 100% 100%, 15% 100%, 0 calc(100% - 15px))" }}
    >
      <div className="flex items-center gap-3">
        {isLocked ? <div className="h-2 w-2 animate-pulse rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,1)]" /> : null}
        <h2 className="font-mono text-xl font-black uppercase tracking-widest text-white drop-shadow-md" style={{ textShadow: `0 0 10px ${baseColor}80` }}>
          {section.title}
        </h2>
      </div>
      {isLocked ? <p className="mt-2 border border-red-500/20 bg-red-950/50 px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-red-400">[ OFFLINE ]</p> : null}
      {isLocked && isLockReasonVisible && section.lockReason ? (
        <p className="mt-2 max-w-[190px] text-center font-mono text-[10px] font-bold uppercase tracking-widest text-amber-300">{section.lockReason}</p>
      ) : null}
    </button>
  );
}
