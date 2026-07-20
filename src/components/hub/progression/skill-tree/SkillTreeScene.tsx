// src/components/hub/progression/skill-tree/SkillTreeScene.tsx - Constelación del árbol de habilidades del
// Operador (ficha 8). Aristas en SVG (con glow) + nodos como botones HTML holográficos (iconos lucide, anillo
// de progreso por rango, estados). Pinta GET /api/progression/skill-tree y sube rangos vía POST .../rank-up:
// la autoridad es el servidor (tras subir, re-lee el estado — nada de puntos en el cliente).
"use client";

import { useMemo, useRef, useState, type ComponentType } from "react";
import {
  BatteryCharging, Bolt, CircleDollarSign, Coins, Cpu, Crown, GraduationCap, Heart, Lock, Medal,
  RotateCcw, ShieldHalf, type LucideProps,
} from "lucide-react";
import { AcademyBackButton } from "@/components/hub/academy/AcademyBackButton";
import { useViewportWidth } from "@/components/hub/internal/use-viewport-width";
import { ISkillTreeNodeView, ISkillTreeView } from "@/core/services/progression/skill-tree/resolve-skill-tree-view";
import { canRespecSkillTree } from "@/core/services/progression/skill-tree/skill-tree-respec-eligibility";
import { resolveSkillTreeLayout, skillTreeViewBox } from "./resolve-skill-tree-layout";

type BranchTab = "COMBAT" | "ECONOMY" | "ARSENAL";
const BRANCH_TABS: BranchTab[] = ["COMBAT", "ECONOMY", "ARSENAL"];

const BRANCH: Record<string, { color: string; label: string }> = {
  ROOT: { color: "#38e0f0", label: "" },
  COMBAT: { color: "#22d3ee", label: "COMBATE" },
  ECONOMY: { color: "#f5b23a", label: "ECONOMÍA" },
  ARSENAL: { color: "#a78bfa", label: "ARSENAL" },
};

const NODE_ICON: Record<string, ComponentType<LucideProps>> = {
  core: Cpu, nexus: CircleDollarSign, xp: GraduationCap, "shield-half": ShieldHalf,
  coins: Coins, crown: Crown, heart: Heart, bolt: Bolt, battery: BatteryCharging, medal: Medal,
  rotate: RotateCcw,
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
  const [activeBranch, setActiveBranch] = useState<BranchTab>("COMBAT");
  const [confirmingRespec, setConfirmingRespec] = useState(false);
  // Retiene el último nodo mostrado en el bottom-sheet para animar la SALIDA con contenido (no vacío).
  const sheetNodeRef = useRef<ISkillTreeNodeView | null>(null);

  const viewportWidth = useViewportWidth();
  // Móvil / pantallas estrechas: una rama a la vez con selector (sin scroll). Desktop: árbol completo.
  const isBranchMode = viewportWidth < 900;
  const mode = isBranchMode ? "branch" : "full";
  const vb = skillTreeViewBox(mode);

  const nodeById = useMemo(() => new Map((tree?.nodes ?? []).map((n) => [n.node.id, n])), [tree]);
  const visibleNodes = useMemo(() => {
    const all = tree?.nodes ?? [];
    if (!isBranchMode) return all;
    return all.filter((n) => n.node.branch === "ROOT" || n.node.branch === activeBranch);
  }, [tree, isBranchMode, activeBranch]);
  const layout = useMemo(() => resolveSkillTreeLayout(visibleNodes, mode), [visibleNodes, mode]);
  const visibleIds = useMemo(() => new Set(visibleNodes.map((n) => n.node.id)), [visibleNodes]);
  const selected = selectedId ? nodeById.get(selectedId) ?? null : null;

  if (!tree) {
    return (
      <div className="mx-auto w-full max-w-5xl px-3 py-4">
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-2 px-6 text-center text-cyan-200/70">
          {!authenticated ? (
            <p>Inicia sesión para ver tu árbol de Operador.</p>
          ) : (
            <>
              <p className="text-slate-200">El árbol de habilidades aún no está disponible.</p>
              <p className="text-xs text-slate-500">Las tablas del árbol no están migradas en esta base de datos (migraciones 136/137).</p>
            </>
          )}
        </div>
        <div className="mt-5 flex justify-center">
          <AcademyBackButton label="Volver a Academia" href="/hub/academy" />
        </div>
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

  async function respec() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/progression/skill-tree/respec", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operationId: crypto.randomUUID() }),
      });
      const result = (await res.json()) as { ok?: boolean; reason?: string };
      if (!res.ok || result.ok === false) {
        setError(result.reason === "no_respec_key" ? "Necesitas la habilidad Reasignación." : "No se pudo reasignar.");
      } else {
        setSelectedId(null);
      }
      await refetch();
    } catch {
      setError("Error de red al reasignar.");
    } finally {
      setBusy(false);
      setConfirmingRespec(false);
    }
  }

  const xpPct = tree.xpForNext > 0 ? Math.min(100, Math.round((tree.xpIntoLevel / tree.xpForNext) * 100)) : 0;
  const pointsAvailable = tree.pointsAvailable;
  // Reasignar (respec): solo si el jugador tiene la "llave" (nodo Reasignación desbloqueado). Modelo A.
  const canRespec = canRespecSkillTree(tree.nodes);
  const showPanel = Boolean(selected && visibleIds.has(selected.node.id));
  // Nodo que pinta el bottom-sheet: el actual si está abierto; si no, el último (para animar la salida).
  if (showPanel && selected) sheetNodeRef.current = selected;
  const sheetNode = showPanel ? selected : sheetNodeRef.current;

  function renderPanel(node: ISkillTreeNodeView) {
    const c = branchColor(node.node.branch);
    return (
      <>
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] opacity-25" />
        <div className="relative">
          <div className="flex items-center justify-between gap-2">
            <div className="font-display text-sm tracking-wide text-slate-100">{node.node.display.name}</div>
            <div className="font-display text-xs" style={{ color: c }}>Nv. {node.rank}/{node.node.maxRank}</div>
          </div>
          <div className="mt-2 flex gap-1">
            {Array.from({ length: node.node.maxRank }).map((_, i) => (
              <span key={i} className="h-1.5 flex-1 rounded-full" style={{ background: i < node.rank ? c : "rgba(100,116,139,0.3)", boxShadow: i < node.rank ? `0 0 6px ${c}` : "none" }} />
            ))}
          </div>
          <p className="mt-2.5 text-xs leading-relaxed text-slate-400">{node.node.display.blurb}</p>
          {node.node.branch === "COMBAT" && (
            <p className="mt-1.5 flex items-center gap-1 font-display text-[9px] uppercase tracking-wider text-cyan-300/70">
              <Bolt className="h-3 w-3" /> Efecto solo en Story y Arena
            </p>
          )}
          {!node.prerequisitesMet && (
            <div className="mt-2 flex items-center gap-1.5 text-[11px] text-amber-300/90">
              <Lock className="h-3.5 w-3.5" />
              {node.node.prerequisites.map((p) => `${nodeById.get(p.nodeId)?.node.display.name ?? p.nodeId} Nv.${p.minRank}`).join(" · ")}
            </div>
          )}
          <button
            type="button"
            disabled={busy || !node.isUnlockable}
            onClick={() => rankUp(node.node.id)}
            className="mt-3 w-full border border-cyan-400/60 bg-cyan-400/15 py-2 font-display text-xs uppercase tracking-widest text-cyan-100 shadow-[0_0_16px_rgba(34,211,238,0.25)] transition enabled:hover:bg-cyan-400/25 disabled:cursor-not-allowed disabled:opacity-40"
            style={{ clipPath: "polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)" }}
          >
            {node.isMaxed ? "Al máximo"
              : !node.prerequisitesMet ? "Bloqueado"
              : node.nextCost !== null && pointsAvailable < node.nextCost ? "Puntos insuficientes"
              : `Subir a Nv.${node.rank + 1} · ${node.nextCost} pt`}
          </button>
        </div>
      </>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col px-3 py-2 sm:py-4">
      {/* Cabecera HUD (compacta en móvil: una sola fila) */}
      <div className="mb-2 flex items-center justify-between gap-2 rounded-xl border border-cyan-500/25 bg-slate-950/60 px-3 py-2 sm:mb-3 sm:gap-4 sm:px-4 sm:py-3">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-cyan-400/70 text-cyan-300 shadow-[0_0_16px_rgba(34,211,238,0.35)] sm:h-11 sm:w-11">
            <Bolt className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <div className="leading-none">
            <div className="hidden font-display text-[11px] tracking-[0.2em] text-cyan-300/80 sm:block">OPERADOR</div>
            <div className="font-display text-sm tracking-wide text-slate-100 sm:text-lg">NIVEL {tree.level}</div>
          </div>
        </div>
        <div className="min-w-0 flex-1 sm:max-w-xs">
          <div className="mb-1 flex justify-between text-[10px] text-slate-400 sm:text-[11px]">
            <span>XP</span>
            <span>{tree.xpIntoLevel.toLocaleString()} / {tree.xpForNext.toLocaleString()}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded bg-slate-700/50">
            <div className="h-full rounded bg-gradient-to-r from-sky-500 to-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.7)]" style={{ width: `${xpPct}%` }} />
          </div>
        </div>
        <div className="text-right leading-none">
          <div className="font-display text-[9px] uppercase tracking-widest text-amber-300/80 sm:text-[11px]">Puntos</div>
          <div className="font-display text-lg font-medium text-amber-200 drop-shadow-[0_0_12px_rgba(250,204,21,0.5)] sm:text-2xl">{tree.pointsAvailable}</div>
        </div>
        {canRespec && (
          <button
            type="button"
            aria-label="Reasignar puntos del árbol"
            disabled={busy}
            onClick={() => setConfirmingRespec(true)}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-violet-400/50 text-violet-300 transition enabled:hover:border-violet-300 enabled:hover:bg-violet-500/15 disabled:opacity-40 sm:h-9 sm:w-auto sm:gap-1.5 sm:px-3"
          >
            <RotateCcw className="h-4 w-4" />
            <span className="hidden font-display text-[10px] uppercase tracking-widest sm:inline">Reasignar</span>
          </button>
        )}
      </div>

      {error && <div className="mb-3 rounded-lg border border-rose-500/40 bg-rose-950/30 px-3 py-2 text-sm text-rose-200">{error}</div>}

      {/* Selector de rama (solo móvil / pantallas estrechas): una sección a la vez, sin scroll */}
      {isBranchMode && (
        <div className="mb-3 flex gap-2">
          {BRANCH_TABS.map((b) => {
            const active = activeBranch === b;
            const c = BRANCH[b].color;
            return (
              <button
                key={b}
                type="button"
                onClick={() => { setActiveBranch(b); setSelectedId(null); }}
                className="flex-1 border py-2 font-display text-[10px] uppercase tracking-widest transition"
                style={{
                  color: active ? "#04101d" : c,
                  background: active ? c : `${c}14`,
                  borderColor: active ? c : `${c}55`,
                  boxShadow: active ? `0 0 16px ${c}66` : "none",
                  clipPath: "polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)",
                }}
              >
                {BRANCH[b].label}
              </button>
            );
          })}
        </div>
      )}

      {/* Constelación (caja adaptable: encaja en pantalla por ancho y alto, sin scroll) */}
      <div
        className={`relative flex justify-center rounded-2xl border border-cyan-500/25 p-1 ${isBranchMode && showPanel ? "z-[51]" : ""}`}
        style={{ boxShadow: "0 0 40px rgba(34,211,238,0.06) inset, 0 0 0 1px rgba(34,211,238,0.04)" }}
      >
        <div
          className="relative overflow-hidden rounded-xl"
          style={{
            // Móvil: limita por el ALTO disponible (reserva header+selector+botón) → todo cabe sin scroll.
            // Desktop: limita por 72vh. En ambos, el ancho nunca pasa del 100% del contenedor.
            width: isBranchMode
              ? `min(100%, calc((100dvh - 218px) * ${vb.width} / ${vb.height}))`
              : `min(100%, calc(72vh * ${vb.width} / ${vb.height}))`,
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
            {visibleNodes.map((view) =>
              view.node.prerequisites.map((prereq) => {
                const from = layout.get(prereq.nodeId);
                const to = layout.get(view.node.id);
                if (!from || !to || !visibleIds.has(prereq.nodeId)) return null;
                const source = nodeById.get(prereq.nodeId);
                const met = source ? source.rank >= prereq.minRank : false;
                const color = branchColor(view.node.branch);
                return (
                  <g key={`${view.node.id}-${prereq.nodeId}`}>
                    {met && <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke={color} strokeOpacity={0.2} strokeWidth={8} strokeLinecap="round" />}
                    <line
                      x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                      className={met ? "skill-edge-flow" : undefined}
                      stroke={met ? color : "#2a3852"} strokeOpacity={met ? 0.95 : 0.8}
                      strokeWidth={met ? 2.4 : 1.6} strokeLinecap="round"
                      strokeDasharray={met ? undefined : "3 6"}
                    />
                  </g>
                );
              }),
            )}
          </svg>

          {/* Etiquetas de rama (solo en modo completo; en móvil las cubre el selector) */}
          {!isBranchMode && (["COMBAT", "ARSENAL", "ECONOMY"] as const).map((b) => {
            const leftPct = b === "COMBAT" ? 210 / vb.width : b === "ARSENAL" ? 500 / vb.width : 790 / vb.width;
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
          {visibleNodes.map((view) => {
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
                onClick={() => setSelectedId((prev) => (prev === view.node.id ? null : view.node.id))}
                className="group absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center focus:outline-none"
                style={{ left: `${(pos.x / vb.width) * 100}%`, top: `${(pos.y / vb.height) * 100}%` }}
                aria-label={`${view.node.display.name} nivel ${view.rank} de ${view.node.maxRank}`}
              >
                {/* Anillo de progreso por rango */}
                <span
                  className="relative flex h-[52px] w-[52px] items-center justify-center rounded-full p-[3px] transition-transform group-hover:scale-110"
                  style={{
                    background: `conic-gradient(${color} ${pct}%, rgba(100,116,139,0.28) ${pct}%)`,
                    boxShadow: isSelected ? `0 0 24px ${color}` : dim ? "none" : `0 0 18px ${color}55`,
                    opacity: dim ? 0.6 : 1,
                  }}
                >
                  {/* Anillo pulsante para "disponible" */}
                  {state === "available" && (
                    <span className="absolute -inset-1 animate-ping rounded-full border" style={{ borderColor: `${color}99` }} />
                  )}
                  {/* Anillo de selección (marca el nodo activo sin translucir el núcleo → sin "queso") */}
                  {isSelected && (
                    <span className="absolute -inset-[3px] rounded-full" style={{ border: `2px solid ${color}`, boxShadow: `0 0 12px ${color}aa` }} />
                  )}
                  {/* Núcleo (SIEMPRE opaco: solo el borde de 3px muestra el anillo cónico) */}
                  <span
                    className="flex h-full w-full items-center justify-center rounded-full"
                    style={{
                      background: "#0a1120",
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
                <span className="mt-1.5 max-w-[104px] text-center font-display text-[9.5px] uppercase leading-tight tracking-wide text-slate-300" style={{ textShadow: "0 1px 6px rgba(2,11,22,0.9)" }}>
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

        {/* Detalle FLOTANTE (solo desktop): panel a la derecha, no tapa nodos relevantes */}
        {showPanel && !isBranchMode && selected && (
          <div
            className="absolute bottom-3 right-3 z-10 w-80 border border-cyan-400/40 bg-[#04101d]/95 p-4 shadow-[0_0_30px_rgba(34,211,238,0.18)] backdrop-blur-md"
            style={{ clipPath: "polygon(14px 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%, 0 14px)" }}
          >
            {renderPanel(selected)}
          </div>
        )}
      </div>

      {/* Volver a Academia: abajo, centrado */}
      <div className="mt-3 flex justify-center sm:mt-5">
        <AcademyBackButton label="Volver a Academia" href="/hub/academy" />
      </div>

      {/* Detalle como DIÁLOGO (móvil): bottom-sheet SIEMPRE montado → desliza desde abajo al abrir y se
          esconde abajo al cerrar. Backdrop y sheet separados: backdrop z-50 cierra al tocar fuera,
          constellation z-51 recibe clics en nodos, sheet z-[52] siempre visible arriba de todo. */}
      {isBranchMode && (
        <>
          <div
            className={`fixed inset-0 z-50 ${showPanel ? "" : "pointer-events-none"}`}
            onClick={() => setSelectedId(null)}
          />
          <div
            className={`fixed inset-x-0 bottom-0 z-[52] w-full border-t border-cyan-400/40 bg-[#04101d] p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_-8px_30px_rgba(34,211,238,0.25)] transition-transform duration-300 ease-out ${showPanel ? "translate-y-0" : "translate-y-full"}`}
            role="dialog"
            aria-modal="true"
            aria-hidden={!showPanel}
          >
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-slate-600" />
            {sheetNode && renderPanel(sheetNode)}
          </div>
        </>
      )}

      {/* Confirmación de reasignación: acción DESTRUCTIVA (resetea todo el árbol), por eso pide confirmar. */}
      {confirmingRespec && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="w-full max-w-sm rounded-2xl border border-violet-400/40 bg-[#0a0714]/95 p-6 text-center shadow-[0_0_50px_rgba(167,139,250,0.25)]">
            <RotateCcw className="mx-auto mb-3 h-8 w-8 text-violet-300" />
            <h2 className="font-display text-lg uppercase tracking-wide text-slate-100">Reasignar árbol</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              Se reiniciarán <span className="font-bold text-violet-200">todos</span> tus nodos y recuperarás los
              puntos para repartirlos de nuevo. También se pierde la propia habilidad <span className="text-violet-200">Reasignación</span>
              {" "}(tendrás que recomprarla para volver a reasignar). Tu nivel y tu XP no cambian.
            </p>
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                disabled={busy}
                onClick={() => setConfirmingRespec(false)}
                className="flex-1 rounded-lg border border-slate-600 py-2.5 font-display text-xs uppercase tracking-widest text-slate-300 transition enabled:hover:bg-slate-800/60 disabled:opacity-40"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={respec}
                className="flex-1 rounded-lg border border-violet-400/60 bg-violet-500/20 py-2.5 font-display text-xs uppercase tracking-widest text-violet-100 transition enabled:hover:bg-violet-500/30 disabled:opacity-40"
              >
                {busy ? "Reasignando…" : "Reasignar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
