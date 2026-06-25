// src/components/admin/AdminLiveOpsPanel.tsx - Panel admin de live-ops con pestañas: misiones, eventos, login diario y novedades. Edición sin SQL, estilo del juego.
"use client";

import { useState } from "react";
import { IAdminMissionDefinition, IAdminPromotionConfig, ILiveOpsAdminData } from "@/core/entities/progression/ILiveOpsAdmin";
import { AdminMissionRow } from "@/components/admin/internal/AdminMissionRow";
import { AdminPromotionRow } from "@/components/admin/internal/AdminPromotionRow";
import { AdminEventEditor } from "@/components/admin/internal/AdminEventEditor";
import { AdminLoginDayRow } from "@/components/admin/internal/AdminLoginDayRow";

type Tab = "missions" | "events" | "login" | "promotions";

const TABS: { id: Tab; label: string; hint: string }[] = [
  { id: "missions", label: "Misiones", hint: "Objetivos diarios y semanales que dan Nexus al completarlos." },
  { id: "events", label: "Eventos", hint: "Cómo se ganan puntos y qué cartas se canjean con ellos." },
  { id: "login", label: "Login diario", hint: "Recompensa de cada día consecutivo conectado (ciclo de 7 días)." },
  { id: "promotions", label: "Novedades", hint: "Banners que se muestran en el hub y enlazan a secciones." },
];

function blankMission(order: number): IAdminMissionDefinition {
  return {
    id: `mission-${Math.random().toString(36).slice(2, 8)}`,
    scope: "DAILY",
    objectiveType: "PLAY_DUEL",
    objectiveParam: null,
    targetCount: 1,
    rewardNexus: 100,
    rewardType: "NEXUS",
    eventId: null,
    title: "Nueva misión",
    description: null,
    sortOrder: order,
    isActive: false,
  };
}

function blankPromotion(order: number): IAdminPromotionConfig {
  return {
    id: `promo-${Math.random().toString(36).slice(2, 8)}`,
    kind: "NEWS",
    title: "Nueva novedad",
    body: "",
    mediaUrl: null,
    ctaLabel: null,
    ctaHref: null,
    sortOrder: order,
    isActive: false,
  };
}

export function AdminLiveOpsPanel({ data }: { data: ILiveOpsAdminData }) {
  const [tab, setTab] = useState<Tab>("missions");
  const [missions, setMissions] = useState<IAdminMissionDefinition[]>(data.missions);
  const [promotions, setPromotions] = useState<IAdminPromotionConfig[]>(data.promotions);
  const counts: Record<Tab, number> = {
    missions: missions.length,
    events: data.events.length,
    login: data.loginCalendar.length,
    promotions: promotions.length,
  };

  function addMission() {
    setMissions((prev) => [blankMission(prev.length + 20), ...prev]);
  }
  function addPromotion() {
    setPromotions((prev) => [blankPromotion(prev.length + 10), ...prev]);
  }

  const addButtonClass = "flex w-full items-center justify-center gap-2 border border-dashed border-cyan-600/60 bg-cyan-500/5 py-3 font-mono text-xs font-bold uppercase tracking-[0.16em] text-cyan-300 transition-colors hover:border-cyan-400 hover:bg-cyan-500/10";
  const activeHint = TABS.find((entry) => entry.id === tab)?.hint ?? "";

  return (
    <section className="flex h-full min-h-0 flex-1 flex-col gap-4 overflow-hidden">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center border border-cyan-800/60 bg-slate-900/80 text-cyan-300" style={{ clipPath: "polygon(6px 0,100% 0,100% calc(100% - 6px),calc(100% - 6px) 100%,0 100%,0 6px)" }}>
          <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.6" strokeLinejoin="round">
            <path d="M12 2l2.4 5.2L20 8l-4 4 1 6-5-2.8L7 18l1-6-4-4 5.6-.8z" />
          </svg>
        </div>
        <div>
          <h1 className="font-mono text-base font-black uppercase tracking-[0.18em] text-cyan-100">Live-Ops</h1>
          <p className="text-xs text-slate-400">Retención y recompensas · edición sin SQL</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((entry) => (
          <button
            key={entry.id}
            type="button"
            onClick={() => setTab(entry.id)}
            className={`flex items-center gap-2 border px-3.5 py-2 font-mono text-xs font-black uppercase tracking-[0.14em] transition-colors ${tab === entry.id ? "border-cyan-400 bg-cyan-500/15 text-cyan-100" : "border-slate-700 bg-slate-900/60 text-slate-400 hover:border-cyan-700 hover:text-cyan-200"}`}
            style={{ clipPath: "polygon(7px 0,100% 0,100% calc(100% - 7px),calc(100% - 7px) 100%,0 100%,0 7px)" }}
          >
            {entry.label}
            <span className="border border-current px-1 text-[10px] opacity-70">{counts[entry.id]}</span>
          </button>
        ))}
      </div>

      <p className="border-l-2 border-cyan-500/50 bg-cyan-500/5 px-3 py-2 text-xs text-slate-300">{activeHint}</p>

      <div className="home-modern-scroll min-h-0 flex-1 overflow-y-auto pr-1">
        {/* Las 4 secciones se mantienen montadas (oculto las inactivas) para no perder los
            cambios editados/guardados al cambiar de pestaña. */}
        <div className={tab === "missions" ? "space-y-3" : "hidden"}>
          <button type="button" onClick={addMission} className={addButtonClass}>
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
            Nueva misión
          </button>
          {missions.map((mission) => <AdminMissionRow key={mission.id} mission={mission} events={data.events.map((entry) => ({ id: entry.id, name: entry.name }))} />)}
        </div>
        <div className={tab === "events" ? "space-y-3" : "hidden"}>
          {data.events.length > 0 ? data.events.map((event) => <AdminEventEditor key={event.id} event={event} />) : <p className="py-6 text-center text-sm text-slate-500">No hay eventos configurados.</p>}
        </div>
        <div className={tab === "login" ? "space-y-2.5" : "hidden"}>
          {data.loginCalendar.map((day) => <AdminLoginDayRow key={day.dayIndex} day={day} />)}
        </div>
        <div className={tab === "promotions" ? "space-y-3" : "hidden"}>
          <button type="button" onClick={addPromotion} className={addButtonClass}>
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
            Nueva novedad
          </button>
          {promotions.map((promotion) => <AdminPromotionRow key={promotion.id} promotion={promotion} />)}
        </div>
      </div>
    </section>
  );
}
