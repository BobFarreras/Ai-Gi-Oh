// src/components/admin/internal/pve/AdminSurvivalPreview.tsx - Simula la expedición con el resolutor real para ver el escalado antes de publicar.
"use client";

import Image from "next/image";
import { IAdminPveArenaOpponentRef } from "@/core/entities/admin/IAdminPveModes";
import { SurvivalDraft, previewSurvivalRun } from "@/components/admin/internal/pve/admin-survival-preview";
import { PVE_SECTION, PVE_TITLE } from "@/components/admin/internal/pve/admin-pve-styles";

const PREVIEW_BATTLES = 24;

const PROFILE_COLOR: Record<string, string> = {
  HARD: "border-sky-700/50 bg-sky-950/40 text-sky-200",
  BOSS: "border-amber-700/50 bg-amber-950/40 text-amber-200",
  MASTER: "border-fuchsia-700/50 bg-fuchsia-950/40 text-fuchsia-200",
  MYTHIC: "border-rose-700/50 bg-rose-950/40 text-rose-200",
};

/** Ganar todos los combates es el único recorrido posible: perder cierra la expedición. */
export function AdminSurvivalPreview({ draft, arenaOpponents }: { draft: SurvivalDraft; arenaOpponents: IAdminPveArenaOpponentRef[] }) {
  const rows = previewSurvivalRun(draft, PREVIEW_BATTLES);
  const byId = new Map(arenaOpponents.map((opponent) => [opponent.id, opponent] as const));

  return (
    <section className={PVE_SECTION}>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h2 className={PVE_TITLE}>Así se jugará ({PREVIEW_BATTLES} primeros combates)</h2>
        <p className="text-[10px] text-slate-500">Calculado con el mismo resolutor que usa el servidor.</p>
      </div>
      {rows.length === 0 ? (
        <p className="rounded border border-dashed border-slate-700/60 p-3 text-center text-[11px] text-slate-500">
          Añade al menos un rival y un tramo que empiece en el combate 1 para ver la simulación.
        </p>
      ) : (
        <div className="home-modern-scroll max-h-[42vh] overflow-y-auto">
          <table className="w-full border-collapse text-[11px]">
            <thead className="sticky top-0 bg-[#040d1a]">
              <tr className="text-left text-[9.5px] uppercase tracking-wider text-slate-500">
                <th className="p-1.5 font-bold">#</th>
                <th className="p-1.5 font-bold">Rival</th>
                <th className="p-1.5 font-bold">Tier</th>
                <th className="p-1.5 font-bold">IA</th>
                <th className="p-1.5 font-bold" title="Vueltas completas tras alcanzar el tier máximo">Ascensión</th>
                <th className="p-1.5 font-bold" title="LP y stats que el rival gana por la Ascensión">Refuerzo</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const opponent = byId.get(row.opponentId);
                return (
                  <tr key={row.battleIndex} className={`border-t border-slate-800/60 ${row.isMilestone ? "bg-emerald-950/20" : ""}`}>
                    <td className="p-1.5 font-mono text-slate-400">{row.battleIndex}</td>
                    <td className="p-1.5">
                      <span className="flex items-center gap-1.5">
                        {opponent?.avatarUrl ? (
                          <Image src={opponent.avatarUrl} alt="" width={22} height={22} unoptimized
                            className="h-[22px] w-[22px] shrink-0 rounded border border-slate-700/60 object-cover" />
                        ) : null}
                        <span className="truncate text-slate-200">{opponent?.displayName ?? row.opponentId}</span>
                        {row.isMilestone ? (
                          <span className="shrink-0 rounded border border-emerald-600/50 px-1 text-[9px] text-emerald-300"
                            title={`Al ganar este combate el jugador recupera ${draft.milestoneHeal} LP`}>
                            +{draft.milestoneHeal} LP
                          </span>
                        ) : null}
                      </span>
                    </td>
                    <td className="p-1.5 font-mono text-cyan-300">T{row.effectiveTier}</td>
                    <td className="p-1.5">
                      <span className={`rounded border px-1.5 py-0.5 text-[9px] font-bold ${PROFILE_COLOR[row.aiProfile] ?? ""}`}>
                        {row.aiProfile}
                      </span>
                    </td>
                    <td className="p-1.5 font-mono text-slate-400">{row.ascensionRank > 0 ? `×${row.ascensionRank}` : "—"}</td>
                    <td className="p-1.5 text-[10px] text-slate-400">
                      {row.opponentLpBonus > 0 || row.statBonusPerRank > 0
                        ? `${row.opponentLpBonus > 0 ? `+${row.opponentLpBonus} LP` : ""}${row.opponentLpBonus > 0 && row.statBonusPerRank > 0 ? " · " : ""}${row.statBonusPerRank > 0 ? `+${row.statBonusPerRank} ATK/DEF` : ""}`
                        : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
