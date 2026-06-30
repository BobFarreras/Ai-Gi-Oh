// src/components/admin/AdminArenaPanel.tsx - Panel admin de Arena: editor visual de mazos (estilo Story) + gestión estructural de tiers/oponentes.
"use client";

import { useState } from "react";
import { AdminArenaDeckEditor } from "@/components/admin/internal/arena/AdminArenaDeckEditor";
import { AdminArenaStructurePanel } from "@/components/admin/internal/arena/AdminArenaStructurePanel";

type ArenaView = "decks" | "structure";

export function AdminArenaPanel() {
  const [view, setView] = useState<ArenaView>("decks");

  return (
    <section className="flex h-full min-h-0 flex-1 flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-cyan-800/50 bg-[linear-gradient(120deg,rgba(4,14,30,0.96),rgba(2,9,20,0.98))] px-4 py-3">
        <div>
          <h1 className="text-sm font-black uppercase tracking-widest text-cyan-100">Arena</h1>
          <p className="text-[10px] text-slate-400">Edita mazos de forma visual o gestiona tiers y oponentes. Los cambios se aplican sin redeploy.</p>
        </div>
        <div className="ml-auto flex items-center gap-1 rounded-lg border border-slate-700/50 bg-slate-950/50 p-1">
          <button
            type="button"
            aria-label="Ver editor visual de mazos"
            className={`h-8 rounded-md border px-3 text-[10px] font-bold uppercase tracking-wider transition ${view === "decks" ? "border-cyan-500/60 bg-cyan-950/50 text-cyan-300" : "border-transparent text-slate-400 hover:text-slate-200"}`}
            onClick={() => setView("decks")}
          >
            Mazos
          </button>
          <button
            type="button"
            aria-label="Ver estructura de tiers y oponentes"
            className={`h-8 rounded-md border px-3 text-[10px] font-bold uppercase tracking-wider transition ${view === "structure" ? "border-fuchsia-500/60 bg-fuchsia-950/50 text-fuchsia-300" : "border-transparent text-slate-400 hover:text-slate-200"}`}
            onClick={() => setView("structure")}
          >
            Estructura
          </button>
        </div>
      </div>

      {view === "decks" ? <AdminArenaDeckEditor /> : <AdminArenaStructurePanel />}
    </section>
  );
}
