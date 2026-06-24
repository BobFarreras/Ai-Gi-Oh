// src/components/admin/internal/AdminLoginDayRow.tsx - Editor de la recompensa de un día del calendario de login (Nexus o carta), con preview de carta real.
"use client";

import { useState } from "react";
import { IAdminLoginRewardDay } from "@/core/entities/progression/ILiveOpsAdmin";
import { LoginRewardType } from "@/core/entities/progression/ILoginStreak";
import { LiveOpsField, LiveOpsNumber, LiveOpsSaveBar, LiveOpsCardPicker } from "./live-ops/live-ops-controls";
import { saveLiveOps } from "./live-ops/save-live-ops";

const TYPES: LoginRewardType[] = ["NEXUS", "CARD"];

export function AdminLoginDayRow({ day }: { day: IAdminLoginRewardDay }) {
  const [draft, setDraft] = useState<IAdminLoginRewardDay>(day);
  function update<K extends keyof IAdminLoginRewardDay>(key: K, value: IAdminLoginRewardDay[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="border border-cyan-900/50 bg-[#03101c]/80 p-4" style={{ clipPath: "polygon(10px 0,100% 0,100% calc(100% - 10px),calc(100% - 10px) 100%,0 100%,0 10px)" }}>
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center border border-cyan-500/60 bg-cyan-500/10 font-mono text-sm font-black text-cyan-200">{draft.dayIndex}</span>
        <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-slate-300">Día {draft.dayIndex}{draft.dayIndex === 7 ? " · Hito" : ""}</span>
        <div className="ml-auto flex border border-cyan-900/60">
          {TYPES.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => update("rewardType", type)}
              className={`px-3 py-1 font-mono text-[10px] font-black uppercase tracking-wider transition-colors ${draft.rewardType === type ? "bg-cyan-500 text-slate-950" : "bg-transparent text-slate-400 hover:text-cyan-200"}`}
            >
              {type === "NEXUS" ? "Nexus" : "Carta"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <LiveOpsField label="Etiqueta" value={draft.label ?? ""} onChange={(value) => update("label", value)} placeholder="Día 1" />
        {draft.rewardType === "NEXUS" ? (
          <LiveOpsNumber label="Recompensa Nexus" value={draft.rewardNexus} onChange={(value) => update("rewardNexus", value)} />
        ) : (
          <div className="sm:col-span-1"><LiveOpsCardPicker cardId={draft.rewardCardId ?? ""} onChange={(value) => update("rewardCardId", value)} /></div>
        )}
      </div>

      <div className="mt-3 flex justify-end">
        <LiveOpsSaveBar onSave={() => saveLiveOps("loginDay", draft)} />
      </div>
    </div>
  );
}
