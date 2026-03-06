// src/components/hub/HubResetCameraButton.tsx - Botón flotante para restaurar la cámara a la vista táctica inicial del hub.
"use client";

import { LocateFixed } from "lucide-react";

interface HubResetCameraButtonProps {
  onReset: () => void;
}

export function HubResetCameraButton({ onReset }: HubResetCameraButtonProps) {
  return (
    <button
      type="button"
      aria-label="Recentrar cámara del hub"
      onClick={onReset}
      className="flex h-12 items-center justify-center gap-2 border border-cyan-500/50 bg-[#030914]/85 px-3 py-2 font-mono text-[10px] font-black uppercase tracking-[0.14em] text-cyan-100 transition-all hover:border-cyan-300 hover:shadow-[0_0_18px_rgba(34,211,238,0.45)] sm:text-xs"
      style={{ clipPath: "polygon(8px 0,100% 0,100% calc(100% - 8px),calc(100% - 8px) 100%,0 100%,0 8px)" }}
    >
      <LocateFixed className="h-4 w-4" />
      <span className="hidden sm:inline">Recentrar</span>
    </button>
  );
}
