// src/components/admin/AdminPveModesPanel.tsx - Panel admin de los modos PvE: Supervivencia y Olimpo en pestañas separadas.
"use client";

import { useState } from "react";
import { AdminOlympusChampionsPanel } from "@/components/admin/internal/pve/AdminOlympusChampionsPanel";
import { AdminOlympusLegendsPanel } from "@/components/admin/internal/pve/AdminOlympusLegendsPanel";
import { AdminOlympusSettingsPanel } from "@/components/admin/internal/pve/AdminOlympusSettingsPanel";
import { AdminSurvivalRulesetPanel } from "@/components/admin/internal/pve/AdminSurvivalRulesetPanel";
import { useAdminPveModes } from "@/components/admin/internal/pve/use-admin-pve-modes";

type PveView = "survival" | "settings" | "legends" | "champions";

const TABS: { id: PveView; label: string; hint: string; accent: string }[] = [
  { id: "survival", label: "Supervivencia", hint: "Roster, hitos y escalado", accent: "border-amber-500/60 bg-amber-950/40 text-amber-300" },
  { id: "settings", label: "Config Olimpo", hint: "Intentos, caducidad y respec", accent: "border-cyan-500/60 bg-cyan-950/50 text-cyan-300" },
  { id: "legends", label: "Leyendas", hint: "Identidad, recompensas y deck", accent: "border-fuchsia-500/60 bg-fuchsia-950/50 text-fuchsia-300" },
  { id: "champions", label: "Campeones", hint: "Vínculo con Arena y árbol", accent: "border-violet-500/60 bg-violet-950/50 text-violet-300" },
];

export function AdminPveModesPanel() {
  const [view, setView] = useState<PveView>("survival");
  const modes = useAdminPveModes();
  const activeTab = TABS.find((tab) => tab.id === view) ?? TABS[0];

  return (
    <section className="flex h-full min-h-0 flex-1 flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-cyan-800/50 bg-[linear-gradient(120deg,rgba(4,14,30,0.96),rgba(2,9,20,0.98))] px-4 py-3">
        <div>
          <h1 className="text-sm font-black uppercase tracking-widest text-cyan-100">Modos PvE</h1>
          <p className="text-[10px] text-slate-400">{activeTab.hint}. Publicar crea versión nueva; las partidas en curso no se reescalan.</p>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-1 rounded-lg border border-slate-700/50 bg-slate-950/50 p-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              aria-label={`Ver ${tab.label}`}
              aria-pressed={view === tab.id}
              className={`h-8 rounded-md border px-3 text-[10px] font-bold uppercase tracking-wider transition ${
                view === tab.id ? tab.accent : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
              onClick={() => setView(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {modes.feedback ? (
        <p role="status" className={`text-[11px] font-semibold ${modes.status === "error" ? "text-rose-300" : "text-emerald-300"}`}>
          {modes.feedback}
        </p>
      ) : null}

      {modes.status === "loading" ? (
        <p className="text-[11px] text-slate-500">Cargando configuración…</p>
      ) : view === "survival" ? (
        <AdminSurvivalRulesetPanel modes={modes} />
      ) : view === "settings" ? (
        <AdminOlympusSettingsPanel modes={modes} />
      ) : view === "legends" ? (
        <AdminOlympusLegendsPanel modes={modes} />
      ) : (
        <AdminOlympusChampionsPanel modes={modes} />
      )}
    </section>
  );
}
