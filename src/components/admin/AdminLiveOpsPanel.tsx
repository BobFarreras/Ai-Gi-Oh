// src/components/admin/AdminLiveOpsPanel.tsx - Panel admin de live-ops: edita definiciones de misiones y promociones sin SQL.
"use client";

import { useState } from "react";
import { IAdminMissionDefinition, IAdminPromotionConfig, ILiveOpsAdminData } from "@/core/entities/progression/ILiveOpsAdmin";
import { AdminMissionRow } from "@/components/admin/internal/AdminMissionRow";
import { AdminPromotionRow } from "@/components/admin/internal/AdminPromotionRow";

export function AdminLiveOpsPanel({ data }: { data: ILiveOpsAdminData }) {
  const [missions] = useState<IAdminMissionDefinition[]>(data.missions);
  const [promotions] = useState<IAdminPromotionConfig[]>(data.promotions);

  return (
    <section className="flex h-full min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-cyan-800/60 bg-slate-900/80">
          <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-cyan-400" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2l2.4 5.2L20 8l-4 4 1 6-5-2.8L7 18l1-6-4-4 5.6-.8z" />
          </svg>
        </div>
        <div>
          <h1 className="text-sm font-black uppercase tracking-widest text-cyan-100">Live-Ops</h1>
          <p className="text-[10px] text-slate-400">Misiones y promociones · edición sin SQL</p>
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-xs font-bold uppercase tracking-widest text-cyan-300">Misiones ({missions.length})</h2>
        <div className="space-y-2">
          {missions.map((mission) => (
            <AdminMissionRow key={mission.id} mission={mission} />
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-xs font-bold uppercase tracking-widest text-cyan-300">Promociones ({promotions.length})</h2>
        <div className="space-y-2">
          {promotions.map((promotion) => (
            <AdminPromotionRow key={promotion.id} promotion={promotion} />
          ))}
        </div>
      </div>
    </section>
  );
}
