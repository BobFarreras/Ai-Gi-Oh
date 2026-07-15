// src/components/hub/home/objects/ArsenalSectionSwitch.tsx - Conmutador Cartas / Objetos del arsenal.
"use client";

import { Layers, Package } from "lucide-react";

export type ArsenalSection = "CARDS" | "OBJECTS";

interface IArsenalSectionSwitchProps {
  section: ArsenalSection;
  onSectionChange: (value: ArsenalSection) => void;
}

export function ArsenalSectionSwitch({ section, onSectionChange }: IArsenalSectionSwitchProps) {
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
    </div>
  );
}
