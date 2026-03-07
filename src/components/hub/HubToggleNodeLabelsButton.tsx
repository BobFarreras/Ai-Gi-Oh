// src/components/hub/HubToggleNodeLabelsButton.tsx - Botón para alternar visibilidad de paneles de nombre en nodos del hub.
"use client";

import { Eye, EyeOff } from "lucide-react";

interface HubToggleNodeLabelsButtonProps {
  isVisible: boolean;
  onToggle: () => void;
  onActionSound?: () => void;
}

export function HubToggleNodeLabelsButton({ isVisible, onToggle, onActionSound }: HubToggleNodeLabelsButtonProps) {
  return (
    <button
      type="button"
      aria-label={isVisible ? "Ocultar tarjetas de nodos" : "Mostrar tarjetas de nodos"}
      onClick={() => {
        onActionSound?.();
        onToggle();
      }}
      className="flex h-12 items-center justify-center gap-2 border border-cyan-500/50 bg-[#030914]/85 px-3 py-2 font-mono text-[10px] font-black uppercase tracking-[0.14em] text-cyan-100 transition-all hover:border-cyan-300 hover:shadow-[0_0_18px_rgba(34,211,238,0.45)] sm:text-xs"
      style={{ clipPath: "polygon(8px 0,100% 0,100% calc(100% - 8px),calc(100% - 8px) 100%,0 100%,0 8px)" }}
    >
      {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      <span className="hidden sm:inline">{isVisible ? "Ocultar HUD" : "Mostrar HUD"}</span>
    </button>
  );
}
