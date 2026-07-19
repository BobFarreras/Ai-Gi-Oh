// src/components/hub/progression/skill-tree/SkillTreeScene.tsx - Constelación del árbol de habilidades del
// Operador (ficha 8). Pinta el estado que sirve GET /api/progression/skill-tree y sube rangos vía
// POST .../rank-up. La autoridad es el servidor: tras subir, re-lee el estado (nada de puntos en el cliente).
"use client";

import { useMemo, useState } from "react";
import { Bolt, Lock } from "lucide-react";
import { ISkillTreeNodeView, ISkillTreeView } from "@/core/services/progression/skill-tree/resolve-skill-tree-view";
import { SKILL_TREE_VIEWBOX, resolveSkillTreeLayout } from "./resolve-skill-tree-layout";

const BRANCH_COLOR: Record<string, string> = {
  ROOT: "#22d3ee",
  COMBAT: "#22d3ee",
  ECONOMY: "#f59e0b",
  ARSENAL: "#a78bfa",
};

const BRANCH_LABEL: Record<string, string> = {
  COMBAT: "COMBATE",
  ECONOMY: "ECONOMÍA",
  ARSENAL: "ARSENAL",
};

function nodeColor(view: ISkillTreeNodeView): string {
  return BRANCH_COLOR[view.node.branch] ?? "#22d3ee";
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

  return (
    <div className="mx-auto w-full max-w-5xl px-3 py-4">
      {/* Cabecera HUD */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-cyan-500/25 bg-slate-950/60 px-4 py-3">
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
      <div className="relative overflow-hidden rounded-xl border border-cyan-500/20 bg-[#070b16]">
        <svg viewBox={`0 0 ${SKILL_TREE_VIEWBOX.width} ${SKILL_TREE_VIEWBOX.height}`} className="w-full" role="img" aria-label="Árbol de habilidades del Operador">
          {/* Aristas (prerequisitos) */}
          {tree.nodes.map((view) =>
            view.node.prerequisites.map((prereq) => {
              const from = layout.get(prereq.nodeId);
              const to = layout.get(view.node.id);
              if (!from || !to) return null;
              const source = nodeById.get(prereq.nodeId);
              const met = source ? source.rank >= prereq.minRank : false;
              return (
                <g key={`${view.node.id}-${prereq.nodeId}`}>
                  <line
                    x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                    stroke={met ? nodeColor(view) : "#334155"}
                    strokeOpacity={met ? 0.75 : 0.9}
                    strokeWidth={2}
                    strokeDasharray={met ? undefined : "5 4"}
                  />
                  {!met && (
                    <text x={(from.x + to.x) / 2} y={(from.y + to.y) / 2 - 4} textAnchor="middle" fontSize="10" fill="#8091ad">
                      Nv.{prereq.minRank}
                    </text>
                  )}
                </g>
              );
            }),
          )}

          {/* Nodos */}
          {tree.nodes.map((view) => {
            const pos = layout.get(view.node.id);
            if (!pos) return null;
            const color = nodeColor(view);
            const isSelected = selectedId === view.node.id;
            const state = view.isMaxed ? "maxed" : view.rank > 0 ? "partial" : view.isUnlockable ? "available" : "locked";
            const fill = state === "maxed" || state === "partial" ? `${color}22` : "#141a2e";
            const stroke = state === "locked" ? "#475569" : color;
            const opacity = state === "locked" ? 0.55 : 1;
            const glow = state === "maxed" || state === "available";
            return (
              <g
                key={view.node.id}
                opacity={opacity}
                onClick={() => setSelectedId(view.node.id)}
                style={{ cursor: "pointer" }}
              >
                {glow && <circle cx={pos.x} cy={pos.y} r={30} fill="none" stroke={color} strokeWidth={1.5} strokeOpacity={0.5} />}
                <circle cx={pos.x} cy={pos.y} r={24} fill={fill} stroke={stroke} strokeWidth={isSelected ? 4 : state === "available" ? 2.5 : 2} strokeDasharray={state === "available" ? "5 4" : undefined} />
                <text x={pos.x} y={pos.y + 4} textAnchor="middle" fontSize="12" fill={state === "locked" ? "#94a3b8" : color} fontWeight="500">
                  {view.node.branch === "ROOT" ? "◈" : view.rank > 0 ? view.rank : state === "locked" ? "🔒" : "+"}
                </text>
                <text x={pos.x} y={pos.y - 32} textAnchor="middle" fontSize="10.5" fill="#cbd5e1">{view.node.display.name}</text>
                {view.node.maxRank > 1 && (
                  <text x={pos.x} y={pos.y + 40} textAnchor="middle" fontSize="10" fill={color} fillOpacity={0.9}>
                    Nv. {view.rank}/{view.node.maxRank}
                  </text>
                )}
              </g>
            );
          })}

          {/* Etiquetas de rama */}
          {(["COMBAT", "ARSENAL", "ECONOMY"] as const).map((branch) => {
            const x = branch === "COMBAT" ? 190 : branch === "ARSENAL" ? 410 : 630;
            return (
              <text key={branch} x={x} y={30} textAnchor="middle" fontSize="11" letterSpacing="2" fill={BRANCH_COLOR[branch]} fillOpacity={0.7} className="font-display">
                {BRANCH_LABEL[branch]}
              </text>
            );
          })}
        </svg>

        {/* Panel del nodo seleccionado */}
        {selected && (
          <div className="absolute bottom-3 left-3 right-3 rounded-xl border border-cyan-500/30 bg-slate-950/90 p-4 backdrop-blur sm:left-auto sm:w-72">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-slate-100">{selected.node.display.name}</div>
              <div className="text-xs" style={{ color: nodeColor(selected) }}>Nv. {selected.rank}/{selected.node.maxRank}</div>
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-400">{selected.node.display.blurb}</p>
            {!selected.prerequisitesMet && (
              <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
                <Lock className="h-3.5 w-3.5" />
                {selected.node.prerequisites.map((p) => `${nodeById.get(p.nodeId)?.node.display.name ?? p.nodeId} Nv.${p.minRank}`).join(", ")}
              </div>
            )}
            <button
              type="button"
              disabled={busy || !selected.isUnlockable}
              onClick={() => rankUp(selected.node.id)}
              className="mt-3 w-full rounded-lg border border-cyan-400/60 bg-cyan-400/15 py-2 text-sm text-cyan-100 shadow-[0_0_16px_rgba(34,211,238,0.2)] transition enabled:hover:bg-cyan-400/25 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {selected.isMaxed ? "Al máximo"
                : !selected.prerequisitesMet ? "Bloqueado"
                : selected.nextCost !== null && tree.pointsAvailable < selected.nextCost ? "Puntos insuficientes"
                : `Subir a Nv.${selected.rank + 1} · ${selected.nextCost} pt`}
            </button>
          </div>
        )}
      </div>

      <div className="mt-2 flex items-center justify-center gap-3 text-[11px] text-slate-500">
        <span className="inline-flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee]" />al máximo</span>
        <span className="inline-flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded-full border border-cyan-400" />parcial/disponible</span>
        <span className="inline-flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded-full bg-slate-600" />bloqueado</span>
      </div>
    </div>
  );
}
