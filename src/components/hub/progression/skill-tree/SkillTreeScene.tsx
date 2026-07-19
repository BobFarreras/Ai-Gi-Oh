// src/components/hub/progression/skill-tree/SkillTreeScene.tsx - Constelación del árbol de habilidades del
// Operador (ficha 8). Aristas en SVG (con glow) + nodos como botones HTML holográficos (iconos lucide, anillo
// de progreso por rango, estados). Pinta GET /api/progression/skill-tree y sube rangos vía POST .../rank-up:
// la autoridad es el servidor (tras subir, re-lee el estado — nada de puntos en el cliente).
"use client";

import { useMemo, useState, type ComponentType } from "react";
import {
  BatteryCharging, Bolt, CircleDollarSign, Coins, Cpu, Crown, GraduationCap, Heart, Lock, Medal,
  ShieldHalf, type LucideProps,
} from "lucide-react";
import { ISkillTreeNodeView, ISkillTreeView } from "@/core/services/progression/skill-tree/resolve-skill-tree-view";
import { SKILL_TREE_VIEWBOX, resolveSkillTreeLayout } from "./resolve-skill-tree-layout";

const BRANCH: Record<string, { color: string; label: string }> = {
  ROOT: { color: "#38e0f0", label: "" },
  COMBAT: { color: "#22d3ee", label: "COMBATE" },
  ECONOMY: { color: "#f5b23a", label: "ECONOMÍA" },
  ARSENAL: { color: "#a78bfa", label: "ARSENAL" },
};

const NODE_ICON: Record<string, ComponentType<LucideProps>> = {
  core: Cpu, nexus: CircleDollarSign, xp: GraduationCap, "shield-half": ShieldHalf,
  coins: Coins, crown: Crown, heart: Heart, bolt: Bolt, battery: BatteryCharging, medal: Medal,
};

type NodeState = "maxed" | "partial" | "available" | "locked";

function branchColor(branch: string): string {
  return BRANCH[branch]?.color ?? "#22d3ee";
}

function resolveState(view: ISkillTreeNodeView): NodeState {
  if (view.isMaxed) return "maxed";
  if (view.rank > 0) return "partial";
  if (view.isUnlockable) return "available";
  return "locked";
}

interface ISkillTreeSceneProps {
  initialTree: ISkillTreeView | null;
  authenticated: boolean;
}

export function SkillTreeScene({ initialTree, authenticated }: ISkillTreeSceneProps) {
  const [tree, setTree] = useState<ISkillTreeView | null>(initialTree);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const layout = useMemo(() => (tree ? resolveSkillTreeLayout(tree.nodes) : new Map()), [tree]);
  const nodeById = useMemo(() => new Map((tree?.nodes ?? []).map((n) => [n.node.id, n])), [tree]);
  const selected = selectedId ? nodeById.get(selectedId) ?? null : null;

  if (!tree) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-2 px-6 text-center text-cyan-200/70">
        {!authenticated ? (
          <p>Inicia sesión para ver tu árbol de Operador.</p>
        ) : (
          <>
            <p className="text-slate-200">El árbol de habilidades aún no está disponible.</p>
            <p className="text-xs text-slate-500">Las tablas del árbol no están migradas en esta base de datos (migraciones 136/137).</p>
          </>
        )}
      </div>
    );
  }

  async function refetch() {
    const res = await fetch("/api/progression/skill-tree", { cache: "no-store" });
    if (res.ok) {
      const data = (await res.json()) as { tree: ISkillTreeView | null };
      if (data.tree) setTree(data.tree);
    }
  }

  async function rankUp(nodeId: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/progression/skill-tree/rank-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nodeId, operationId: crypto.randomUUID() }),
      });
      const result = (await res.json()) as { ok?: boolean; reason?: string };
      if (!res.ok || result.ok === false) {
        setError(
          result.reason === "insufficient_points" ? "No tienes puntos suficientes."
          : result.reason === "prereq_unmet" ? "Aún no cumples el requisito."
          : result.reason === "max_rank" ? "Ya está al máximo."
          : "No se pudo subir el rango.",
        );
      }
      await refetch();
    } catch {
      setError("Error de red al subir el rango.");
    } finally {
      setBusy(false);
    }
  }

  const xpPct = tree.xpForNext > 0 ? Math.min(100, Math.round((tree.xpIntoLevel / tree.xpForNext) * 100)) : 0;
  const vb = SKILL_TREE_VIEWBOX;

  return (
    <div className="mx-auto w-full max-w-5xl px-3 py-4">
      {/* Cabecera HUD */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-cyan-500/25 bg-slate-950/60 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full border border-cyan-400/70 text-cyan-300 shadow-[0_0_16px_rgba(34,211,238,0.35)]">
            <Bolt className="h-5 w-5" />
          </div>
          <div>
            <div className="font-display text-[11px] tracking-[0.2em] text-cyan-300/80">OPERADOR</div>
            <div className="font-display text-lg tracking-wide text-slate-100">NIVEL {tree.level}</div>
          </div>
        </div>
        <div className="min-w-[180px] flex-1 sm:max-w-xs">
          <div className="mb-1 flex justify-between text-[11px] text-slate-400">
            <span>XP</span>
            <span>{tree.xpIntoLevel.toLocaleString()} / {tree.xpForNext.toLocaleString()}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded bg-slate-700/50">
            <div className="h-full rounded bg-gradient-to-r from-sky-500 to-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.7)]" style={{ width: `${xpPct}%` }} />
          </div>
        </div>
        <div className="text-right">
          <div className="font-display text-[11px] uppercase tracking-widest text-amber-300/80">Puntos</div>
          <div className="font-display text-2xl font-medium text-amber-200 drop-shadow-[0_0_12px_rgba(250,204,21,0.5)]">{tree.pointsAvailable}</div>
        </div>
      </div>

      {error && <div className="mb-3 rounded-lg border border-rose-500/40 bg-rose-950/30 px-3 py-2 text-sm text-rose-200">{error}</div>}

      {/* Constelación */}
      <div
        className="relative overflow-x-auto rounded-2xl border border-cyan-500/25 p-1"
        style={{ boxShadow: "0 0 40px rgba(34,211,238,0.06) inset, 0 0 0 1px rgba(34,211,238,0.04)" }}
      >
        <div
          className="relative mx-auto w-full min-w-[680px] overflow-hidden rounded-xl"
          style={{
            aspectRatio: `${vb.width} / ${vb.height}`,
            background:
              "radial-gradient(circle at 18% 12%, rgba(56,189,248,0.14), transparent 42%)," +
              "radial-gradient(circle at 84% 86%, rgba(129,140,248,0.16), transparent 46%)," +
              "radial-gradient(circle at 60% 40%, rgba(245,178,58,0.06), transparent 50%)," +
              "linear-gradient(160deg,#060b17 0%,#04070f 100%)",
          }}
        >
          {/* Rejilla + scanline tenues */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.35]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(34,211,238,0.08) 1px, transparent 1px)," +
                "linear-gradient(90deg, rgba(34,211,238,0.08) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.22)_50%)] bg-[length:100%_4px] opacity-25" />

          {/* Aristas (SVG, con glow) */}
          <svg viewBox={`0 0 ${vb.width} ${vb.height}`} preserveAspectRatio="xMidYMid meet" className="absolute inset-0 h-full w-full" aria-hidden>
            {tree.nodes.map((view) =>
              view.node.prerequisites.map((prereq) => {
                const from = layout.get(prereq.nodeId);
                const to = layout.get(view.node.id);
                if (!from || !to) return null;
                const source = nodeById.get(prereq.nodeId);
                const met = source ? source.rank >= prereq.minRank : false;
                const color = branchColor(view.node.branch);
                return (
                  <g key={`${view.node.id}-${prereq.nodeId}`}>
                    {met && <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke={color} strokeOpacity={0.22} strokeWidth={7} strokeLinecap="round" />}
                    <line
                      x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                      stroke={met ? color : "#2a3852"} strokeOpacity={met ? 0.9 : 0.85}
                      strokeWidth={met ? 2.2 : 1.6} strokeLinecap="round"
                      strokeDasharray={met ? undefined : "4 5"}
                    />
                    {!met && (
                      <>
                        <rect x={(from.x + to.x) / 2 - 20} y={(from.y + to.y) / 2 - 17} width={40} height={15} rx={7} fill="#0a1424" stroke={color} strokeOpacity={0.35} />
                        <text x={(from.x + to.x) / 2} y={(from.y + to.y) / 2 - 6} textAnchor="middle" fontSize="9.5" fill="#9fb2cf" style={{ fontFamily: "var(--font-orbitron)" }}>
                          Nv.{prereq.minRank}
                        </text>
                      </>
                    )}
                  </g>
                );
              }),
            )}
          </svg>

          {/* Etiquetas de rama */}
          {(["COMBAT", "ARSENAL", "ECONOMY"] as const).map((b) => {
            const leftPct = b === "COMBAT" ? 190 / vb.width : b === "ARSENAL" ? 410 / vb.width : 630 / vb.width;
            return (
              <div
                key={b}
                className="pointer-events-none absolute top-2 -translate-x-1/2 font-display text-[10px] tracking-[0.28em]"
                style={{ left: `${leftPct * 100}%`, color: BRANCH[b].color, opacity: 0.7, textShadow: `0 0 10px ${BRANCH[b].color}55` }}
              >
                {BRANCH[b].label}
              </div>
            );
          })}

          {/* Nodos (HTML holográfico) */}
          {tree.nodes.map((view) => {
            const pos = layout.get(view.node.id);
            if (!pos) return null;
            const color = branchColor(view.node.branch);
            const state = resolveState(view);
            const isSelected = selectedId === view.node.id;
            const pct = view.node.maxRank > 0 ? (view.rank / view.node.maxRank) * 100 : 0;
            const Icon = NODE_ICON[view.node.display.icon ?? ""] ?? Cpu;
            const dim = state === "locked";
            return (
              <button
                type="button"
                key={view.node.id}
                onClick={() => setSelectedId(view.node.id)}
                className="group absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center focus:outline-none"
                style={{ left: `${(pos.x / vb.width) * 100}%`, top: `${(pos.y / vb.height) * 100}%` }}
                aria-label={`${view.node.display.name} nivel ${view.rank} de ${view.node.maxRank}`}
              >
                {/* Anillo de progreso por rango */}
                <span
                  className="relative flex h-[52px] w-[52px] items-center justify-center rounded-full p-[3px] transition-transform group-hover:scale-110"
                  style={{
                    background: `conic-gradient(${color} ${pct}%, rgba(100,116,139,0.28) ${pct}%)`,
                    boxShadow: dim ? "none" : `0 0 18px ${color}55`,
                    opacity: dim ? 0.6 : 1,
                  }}
                >
                  {/* Anillo pulsante para "disponible" */}
                  {state === "available" && (
                    <span className="absolute -inset-1 animate-ping rounded-full border" style={{ borderColor: `${color}99` }} />
                  )}
                  {/* Núcleo */}
                  <span
                    className="flex h-full w-full items-center justify-center rounded-full"
                    style={{
                      background: isSelected ? `${color}26` : "#0a1120",
                      border: `1.5px solid ${isSelected ? color : dim ? "rgba(100,116,139,0.5)" : `${color}aa`}`,
                    }}
                  >
                    {dim ? (
                      <Lock className="h-4 w-4 text-slate-500" />
                    ) : (
                      <Icon className="h-[22px] w-[22px]" style={{ color }} />
                    )}
                  </span>
                  {/* Marca de "al máximo" */}
                  {state === "maxed" && (
                    <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#0a1120] text-[9px]" style={{ border: `1px solid ${color}`, color }}>
                      ✓
                    </span>
                  )}
                </span>
                {/* Nombre + rango */}
                <span className="mt-1 max-w-[86px] text-center text-[10px] leading-tight text-slate-300" style={{ textShadow: "0 1px 6px rgba(2,11,22,0.9)" }}>
                  {view.node.display.name}
                </span>
                {view.node.maxRank > 1 && (
                  <span className="font-display text-[9px] tracking-wider" style={{ color: dim ? "#64748b" : color }}>
                    {view.rank}/{view.node.maxRank}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Panel del nodo seleccionado (holo-panel estilo hub) */}
        {selected && (
          <div
            className="absolute bottom-3 left-3 right-3 z-10 border border-cyan-400/40 bg-[#04101d]/95 p-4 shadow-[0_0_30px_rgba(34,211,238,0.18)] backdrop-blur-md sm:left-auto sm:w-80"
            style={{ clipPath: "polygon(14px 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%, 0 14px)" }}
          >
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] opacity-25" />
            <div className="relative">
              <div className="flex items-center justify-between gap-2">
                <div className="font-display text-sm tracking-wide text-slate-100">{selected.node.display.name}</div>
                <div className="font-display text-xs" style={{ color: branchColor(selected.node.branch) }}>
                  Nv. {selected.rank}/{selected.node.maxRank}
                </div>
              </div>
              {/* Pips de rango */}
              <div className="mt-2 flex gap-1">
                {Array.from({ length: selected.node.maxRank }).map((_, i) => (
                  <span
                    key={i}
                    className="h-1.5 flex-1 rounded-full"
                    style={{
                      background: i < selected.rank ? branchColor(selected.node.branch) : "rgba(100,116,139,0.3)",
                      boxShadow: i < selected.rank ? `0 0 6px ${branchColor(selected.node.branch)}` : "none",
                    }}
                  />
                ))}
              </div>
              <p className="mt-2.5 text-xs leading-relaxed text-slate-400">{selected.node.display.blurb}</p>
              {!selected.prerequisitesMet && (
                <div className="mt-2 flex items-center gap-1.5 text-[11px] text-amber-300/90">
                  <Lock className="h-3.5 w-3.5" />
                  {selected.node.prerequisites.map((p) => `${nodeById.get(p.nodeId)?.node.display.name ?? p.nodeId} Nv.${p.minRank}`).join(" · ")}
                </div>
              )}
              <button
                type="button"
                disabled={busy || !selected.isUnlockable}
                onClick={() => rankUp(selected.node.id)}
                className="mt-3 w-full border border-cyan-400/60 bg-cyan-400/15 py-2 font-display text-xs uppercase tracking-widest text-cyan-100 shadow-[0_0_16px_rgba(34,211,238,0.25)] transition enabled:hover:bg-cyan-400/25 disabled:cursor-not-allowed disabled:opacity-40"
                style={{ clipPath: "polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)" }}
              >
                {selected.isMaxed ? "Al máximo"
                  : !selected.prerequisitesMet ? "Bloqueado"
                  : selected.nextCost !== null && tree.pointsAvailable < selected.nextCost ? "Puntos insuficientes"
                  : `Subir a Nv.${selected.rank + 1} · ${selected.nextCost} pt`}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Leyenda */}
      <div className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] text-slate-500">
        <span className="inline-flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee]" />al máximo</span>
        <span className="inline-flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-full border border-cyan-400" />disponible</span>
        <span className="inline-flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-full border border-slate-600 bg-slate-800" />bloqueado</span>
      </div>
    </div>
  );
}
