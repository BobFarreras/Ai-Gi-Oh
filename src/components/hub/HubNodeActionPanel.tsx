// src/components/hub/HubNodeActionPanel.tsx - Panel HTML accesible para nodos 3D con navegación o estado bloqueado.
"use client";

import { IHubSection } from "@/core/entities/hub/IHubSection";

interface HubNodeActionPanelProps {
  section: IHubSection;
  baseColor: string;
  isHovered?: boolean;
  isLockReasonVisible: boolean;
  onHoverStart?: () => void;
  onAction: () => void;
}

function withHexAlpha(color: string, alphaHex: string): string {
  if (!color.startsWith("#") || color.length !== 7) return color;
  return `${color}${alphaHex}`;
}

export function HubNodeActionPanel({
  section,
  baseColor,
  isHovered = false,
  isLockReasonVisible,
  onHoverStart,
  onAction,
}: HubNodeActionPanelProps) {
  const isLocked = section.isLocked;

  return (
    <button
      type="button"
      aria-label={isLocked ? `Mostrar bloqueo de ${section.title}` : `Abrir ${section.title}`}
      onClick={onAction}
      onMouseEnter={onHoverStart}
      className={`flex w-[182px] cursor-pointer flex-col items-center justify-center border bg-[#030914]/84 px-2 py-2.5 shadow-lg backdrop-blur-md transition-all hover:scale-105 hover:bg-[#051124]/92 sm:w-[240px] sm:px-1 sm:py-3
        hover:brightness-110
      `}
      style={{
        borderColor: withHexAlpha(baseColor, "80"),
        boxShadow: `0 0 ${isHovered ? "24px" : "14px"} ${withHexAlpha(baseColor, isHovered ? "55" : "33")}`,
        clipPath: "polygon(0 0, 85% 0, 100% 15px, 100% 100%, 15% 100%, 0 calc(100% - 15px))",
      }}
    >
      <div className="flex items-center gap-3">
        {isLocked ? <div className="h-2 w-2 animate-pulse rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,1)]" /> : null}
        <h2 className="text-center font-mono text-base font-black uppercase tracking-[0.16em] text-white drop-shadow-md sm:text-xl sm:tracking-widest" style={{ textShadow: `0 0 10px ${baseColor}80` }}>
          {section.title}
        </h2>
      </div>
      {isLocked ? <p className="mt-1 border border-red-500/20 bg-red-950/50 px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-red-400 sm:mt-2 sm:tracking-widest">[ OFFLINE ]</p> : null}
      {isLocked && isLockReasonVisible && section.lockReason ? (
        <p className="mt-1 max-w-[165px] text-center font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-amber-300 sm:mt-2 sm:max-w-[200px] sm:tracking-widest">{section.lockReason}</p>
      ) : null}
    </button>
  );
}
