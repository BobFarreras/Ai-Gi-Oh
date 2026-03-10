// src/components/hub/story/StoryCircuitMap.tsx - Renderiza el mapa Story en formato circuito con nodos de duelo bloqueables por progreso.
"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { IStoryMapNodeRuntime } from "@/services/story/story-map-runtime-data";
import { resolveStoryNodePosition, resolveStoryPathSegments } from "@/components/hub/story/story-circuit-layout";
import { useViewportWidth } from "@/components/hub/internal/use-viewport-width";

interface StoryCircuitMapProps {
  nodes: IStoryMapNodeRuntime[];
  selectedNodeId?: string | null;
  currentNodeId?: string | null;
  onSelectNode?: (nodeId: string) => void;
}

function resolveNodeTone(node: IStoryMapNodeRuntime): string {
  if (!node.isUnlocked) return "border-zinc-600/70 bg-zinc-900/80 text-zinc-400";
  if (node.isCompleted) return "border-emerald-300/80 bg-emerald-950/65 text-emerald-100";
  if (node.isBossDuel) return "border-fuchsia-300/85 bg-fuchsia-950/55 text-fuchsia-100";
  return "border-cyan-300/80 bg-cyan-950/55 text-cyan-100";
}

function resolveNodeTypeLabel(node: IStoryMapNodeRuntime): string {
  if (node.nodeType === "BOSS") return "BOSS";
  if (node.nodeType === "DUEL") return "DUEL";
  if (node.nodeType === "REWARD_CARD") return "REWARD CARD";
  if (node.nodeType === "REWARD_NEXUS") return "REWARD NX";
  if (node.nodeType === "EVENT") return "EVENT";
  return "MOVE";
}

export function StoryCircuitMap({ nodes, selectedNodeId = null, currentNodeId = null, onSelectNode }: StoryCircuitMapProps) {
  const viewportWidth = useViewportWidth();
  const isMobile = viewportWidth < 768;
  const segments = resolveStoryPathSegments(nodes.length, isMobile);
  return (
    <section className="relative mx-auto h-[74vh] max-h-[780px] min-h-[520px] w-full max-w-6xl overflow-hidden rounded-3xl border border-cyan-400/30 bg-[radial-gradient(circle_at_30%_40%,rgba(34,211,238,0.16),transparent_52%),linear-gradient(180deg,rgba(2,6,23,0.94),rgba(2,18,36,0.96))]">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(34,211,238,0.08)_1px,transparent_1px),linear-gradient(0deg,rgba(34,211,238,0.06)_1px,transparent_1px)] bg-[size:42px_42px]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(59,130,246,0.18),transparent_42%)]" />
      <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden>
        {segments.map((segment, index) => (
          <line
            key={`segment-${index}`}
            x1={segment.from.left}
            y1={segment.from.top}
            x2={segment.to.left}
            y2={segment.to.top}
            stroke="rgba(34,211,238,0.45)"
            strokeWidth="2"
            strokeDasharray="6 6"
          />
        ))}
      </svg>
      {nodes.map((node, index) => {
        const nodePosition = resolveStoryNodePosition(index, isMobile);
        const lockedReason = node.isUnlocked ? "" : "Derrota el nodo anterior para desbloquear.";
        return (
          <article
            key={node.id}
            className="absolute -translate-x-1/2 -translate-y-1/2 transition-transform duration-300 hover:scale-[1.02]"
            style={{ left: nodePosition.left, top: nodePosition.top }}
          >
            <Link
              href={node.isUnlocked ? node.href : "#"}
              aria-disabled={!node.isUnlocked}
              aria-label={`Nodo ${node.chapter}-${node.duelIndex}: ${node.title}`}
              onClick={() => onSelectNode?.(node.id)}
              className={cn(
                "block w-[200px] rounded-xl border px-3 py-2 shadow-[0_10px_26px_rgba(0,0,0,0.5)] sm:w-[220px]",
                resolveNodeTone(node),
                !node.isUnlocked && "cursor-not-allowed opacity-85",
                selectedNodeId === node.id && "ring-2 ring-cyan-300/80",
                currentNodeId === node.id && "shadow-[0_0_18px_rgba(34,211,238,0.45)]",
              )}
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.2em]">Cap {node.chapter} · Nodo {node.duelIndex}</p>
              <h3 className="mt-1 text-base font-black uppercase leading-tight">{node.title}</h3>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wide">{node.opponentName}</p>
              <p className="mt-1 text-[10px] font-black uppercase tracking-[0.16em] text-cyan-200/80">{resolveNodeTypeLabel(node)}</p>
              <p className="mt-1 text-[11px]">Dificultad: {node.difficulty}</p>
              <p className="text-[11px]">Recompensa: {node.rewardNexus} NX · {node.rewardPlayerExperience} EXP</p>
              <p className="mt-1 text-[10px] text-amber-200">{node.isCompleted ? "Completado" : node.isUnlocked ? "Disponible" : lockedReason}</p>
            </Link>
          </article>
        );
      })}
    </section>
  );
}
