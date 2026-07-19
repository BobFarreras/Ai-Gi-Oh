// src/components/hub/home/objects/ArsenalSectionSwitch.tsx - Conmutador Cartas / Objetos del arsenal, con el
// botón opcional de historial de objetos (solo lo pasa la sección Objetos).
"use client";

import { History, Layers, Package } from "lucide-react";

export type ArsenalSection = "CARDS" | "OBJECTS";

interface IArsenalSectionSwitchProps {
  section: ArsenalSection;
  onSectionChange: (value: ArsenalSection) => void;
  /** Abre el historial de objetos aplicados (ficha 9b). Si no llega, el botón no se pinta. */
  onOpenHistory?: () => void;
}

export function ArsenalSectionSwitch({ section, onSectionChange, onOpenHistory }: IArsenalSectionSwitchProps) {
  const tabs: Array<{ value: ArsenalSection; label: string; icon: typeof Layers }> = [
    { value: "CARDS", label: "Cartas", icon: Layers },
    { value: "OBJECTS", label: "Objetos", icon: Package },
  ];
  return (
    <div className="flex shrink-0 items-center gap-1 rounded-lg border border-cyan-800/60 bg-[#020a14]/80 p-0.5">
      {tabs.map((tab) => {
        const isActive = section === tab.value;
        const Icon = tab.icon;
        return (
          <button
            key={tab.value}
            type="button"
            onClick={() => onSectionChange(tab.value)}
            aria-pressed={isActive}
            aria-label={`Sección ${tab.label}`}
            className={`flex h-[34px] items-center gap-1.5 rounded-md px-2.5 text-[10px] font-black uppercase tracking-[0.12em] transition ${
              isActive ? "bg-cyan-500/20 text-cyan-100 shadow-[0_0_12px_rgba(34,211,238,0.25)]" : "text-cyan-400/70 hover:text-cyan-200"
            }`}
          >
            <Icon className="h-4 w-4" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        );
      })}
      {onOpenHistory ? (
        <button
          type="button"
          onClick={onOpenHistory}
          aria-label="Historial de objetos"
          title="Historial de objetos"
          className="flex h-[34px] items-center gap-1.5 rounded-md px-2.5 text-[10px] font-black uppercase tracking-[0.12em] text-amber-300/80 transition hover:text-amber-200"
        >
          <History className="h-4 w-4" />
          <span className="hidden sm:inline">Historial</span>
        </button>
      ) : null}
    </div>
  );
}
