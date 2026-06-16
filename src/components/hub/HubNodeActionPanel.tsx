// src/components/hub/HubNodeActionPanel.tsx - Panel HTML accesible para nodos 3D con navegación o estado bloqueado.
"use client";

import { memo } from "react";
import { IHubSection } from "@/core/entities/hub/IHubSection";

interface HubNodeActionPanelProps {
  section: IHubSection;
  baseColor: string;
  isHovered?: boolean;
  isLockReasonVisible: boolean;
  isNavigationBusy?: boolean;
  isTargetNode?: boolean;
  isDisabled?: boolean;
  onHoverStart?: () => void;
  onAction: () => void;
}

function withHexAlpha(color: string, alphaHex: string): string {
  if (!color.startsWith("#") || color.length !== 7) return color;
  return `${color}${alphaHex}`;
}

function HubNodeActionPanelComponent({
  section,
  baseColor,
  isHovered = false,
  isLockReasonVisible,
  isNavigationBusy = false,
  isTargetNode = false,
  isDisabled: isTourDisabled = false,
  onHoverStart,
  onAction,
}: HubNodeActionPanelProps) {
  const isLocked = section.isLocked;
  const isDisabled = isTourDisabled || (isNavigationBusy && !isTargetNode);
  const statusLabel = isTourDisabled
    ? "[ TUTORIAL ]"
    : isTargetNode && isNavigationBusy
      ? "[ CONECTANDO ]"
      : isLocked
        ? "[ OFFLINE ]"
        : null;

  return (
    <button
      type="button"
      aria-label={
        isTourDisabled
          ? `${section.title} no disponible durante el tutorial`
          : isLocked
            ? `Mostrar bloqueo de ${section.title}`
            : isTargetNode && isNavigationBusy
              ? `Conectando con ${section.title}`
              : `Abrir ${section.title}`
      }
      onClick={onAction}
      disabled={isDisabled}
      onMouseEnter={onHoverStart}
      className={`flex w-[182px] flex-col items-center justify-center border bg-[#030914]/84 px-2 py-2.5 shadow-lg backdrop-blur-md transition-all sm:w-[240px] sm:px-1 sm:py-3 ${
        isDisabled
          ? "cursor-not-allowed opacity-45 grayscale"
          : "cursor-pointer hover:scale-105 hover:bg-[#051124]/92 hover:brightness-110"
      }`}
      style={{
        borderColor: withHexAlpha(baseColor, isDisabled ? "30" : "80"),
        boxShadow: isDisabled
          ? "none"
          : `0 0 ${isHovered ? "24px" : "14px"} ${withHexAlpha(baseColor, isHovered ? "55" : "33")}`,
        clipPath: "polygon(0 0, 85% 0, 100% 15px, 100% 100%, 15% 100%, 0 calc(100% - 15px))",
      }}
    >
      <div className="flex items-center gap-3">
        {isLocked ? <div className="h-2 w-2 animate-pulse rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,1)]" /> : null}
        <h2 className="text-center font-mono text-base font-black uppercase tracking-[0.16em] text-white drop-shadow-md sm:text-xl sm:tracking-widest" style={{ textShadow: `0 0 10px ${baseColor}80` }}>
          {section.title}
        </h2>
      </div>
      {statusLabel ? (
        <p className={`mt-1 border px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.16em] sm:mt-2 sm:tracking-widest ${
          isTargetNode && isNavigationBusy
            ? "border-cyan-400/35 bg-cyan-950/45 text-cyan-200"
            : "border-red-500/20 bg-red-950/50 text-red-400"
        }`}>{statusLabel}</p>
      ) : null}
      {isLocked && isLockReasonVisible && section.lockReason ? (
        <p className="mt-1 max-w-[165px] text-center font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-amber-300 sm:mt-2 sm:max-w-[200px] sm:tracking-widest">{section.lockReason}</p>
      ) : null}
    </button>
  );
}

export const HubNodeActionPanel = memo(HubNodeActionPanelComponent);
