// src/components/hub/home/layout/HomeMobileSectionTabs.tsx - Tabs mobile para alternar entre Deck y Almacén en Arsenal.
"use client";

import { useHubModuleSfx } from "@/components/hub/internal/use-hub-module-sfx";

interface HomeMobileSectionTabsProps {
  activeSection: "DECK" | "COLLECTION";
  onChangeSection: (section: "DECK" | "COLLECTION") => void;
}

export function HomeMobileSectionTabs({ activeSection, onChangeSection }: HomeMobileSectionTabsProps) {
  const { play } = useHubModuleSfx();

  return (
    <div className="grid grid-cols-2 gap-2 rounded-xl border border-cyan-900/40 bg-[#02101d]/70 p-1">
      <button
        type="button"
        aria-pressed={activeSection === "DECK"}
        onClick={() => {
          if (activeSection !== "DECK") play("SECTION_SWITCH");
          onChangeSection("DECK");
        }}
        className={`rounded-lg px-3 py-2 text-xs font-black uppercase tracking-[0.2em] transition ${
          activeSection === "DECK"
            ? "bg-cyan-500/20 text-cyan-100 shadow-[0_0_18px_rgba(34,211,238,0.35)]"
            : "text-cyan-300/70 hover:bg-cyan-900/30"
        }`}
      >
        Deck
      </button>
      <button
        type="button"
        aria-pressed={activeSection === "COLLECTION"}
        onClick={() => {
          if (activeSection !== "COLLECTION") play("SECTION_SWITCH");
          onChangeSection("COLLECTION");
        }}
        className={`rounded-lg px-3 py-2 text-xs font-black uppercase tracking-[0.2em] transition ${
          activeSection === "COLLECTION"
            ? "bg-cyan-500/20 text-cyan-100 shadow-[0_0_18px_rgba(34,211,238,0.35)]"
            : "text-cyan-300/70 hover:bg-cyan-900/30"
        }`}
      >
        Almacén
      </button>
    </div>
  );
}
