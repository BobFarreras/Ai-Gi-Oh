// src/components/hub/academy/training/modes/olympus/internal/OlympusUpgradeTree.tsx - Árbol de mejoras del campeón con compra y reasignación.
"use client";
import { IOlympusUpgradeEffect, IOlympusUpgradeNode, OlympusUpgradeBranch } from "@/core/entities/olympus/IOlympus";
import { IOlympusChampionCard } from "../olympus-api-client";

interface IOlympusUpgradeTreeProps {
  champion: IOlympusChampionCard;
  ascensionFragments: number;
  isBusy: boolean;
  onPurchase: (nodeId: string) => void;
  onRespec: () => void;
}

const BRANCH_LABEL: Record<OlympusUpgradeBranch, string> = {
  POWER: "Potencia",
  RESILIENCE: "Resistencia",
  IDENTITY: "Identidad",
};

const BRANCH_ACCENT: Record<OlympusUpgradeBranch, string> = {
  POWER: "border-rose-500/50 text-rose-300",
  RESILIENCE: "border-sky-500/50 text-sky-300",
  IDENTITY: "border-amber-400/50 text-amber-300",
};

/** Traduce el efecto a lo que el jugador nota en combate, no al nombre interno del `kind`. */
function describeEffect(effect: IOlympusUpgradeEffect): string {
  switch (effect.kind) {
    case "GLOBAL_LEVEL": return `+${effect.amount} nivel a todo el mazo`;
    case "GLOBAL_VERSION_TIER": return `+${effect.amount} versión a todo el mazo`;
    case "SIGNATURE_CARD_LEVEL": return `+${effect.amount} nivel a tus cartas emblemáticas`;
    case "STARTING_LP": return `+${effect.amount} LP iniciales`;
    case "STARTING_ENERGY": return `+${effect.amount} energía máxima`;
  }
}

/** El tope es del atributo, no del nodo: explicarlo evita leer «máx. 100» como «puedes comprarlo 100 veces». */
function describeCap(effect: IOlympusUpgradeEffect): string {
  const prefix = effect.kind === "GLOBAL_VERSION_TIER" ? "V" : "";
  return `Tope del atributo: ${prefix}${effect.cap}`;
}

export function OlympusUpgradeTree(props: IOlympusUpgradeTreeProps) {
  const unlocked = new Set(props.champion.progress?.unlockedNodeIds ?? []);
  const branches = Object.keys(BRANCH_LABEL) as OlympusUpgradeBranch[];
  const investedNodes = props.champion.nodes.filter((node) => unlocked.has(node.id));

  const nodeById = new Map(props.champion.nodes.map((node) => [node.id, node] as const));

  /** Un nodo bloqueado tiene que decir POR QUÉ: no es lo mismo que te falte Éter que un nodo previo. */
  const resolveState = (node: IOlympusUpgradeNode) => {
    if (unlocked.has(node.id)) return { kind: "owned" as const };
    const missing = node.prerequisiteNodeIds.filter((id) => !unlocked.has(id));
    if (missing.length > 0) {
      const names = missing.map((id) => {
        const previous = nodeById.get(id);
        return previous ? describeEffect(previous.effect) : id;
      });
      return { kind: "locked" as const, reason: `Necesitas antes: ${names.join(" · ")}` };
    }
    const shortfall = node.fragmentCost - props.ascensionFragments;
    if (shortfall > 0) return { kind: "expensive" as const, reason: `Te falta ${shortfall} de Éter` };
    return { kind: "available" as const };
  };

  return (
    <section aria-labelledby="olympus-tree-title" className="rounded-2xl border border-violet-800/50 bg-[#120a1e]/80 p-3">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <h2 id="olympus-tree-title" className="text-[11px] font-black uppercase tracking-[0.28em] text-violet-300/80">
          Árbol de {props.champion.displayName}
        </h2>
        <span className="rounded-full border border-amber-400/50 bg-amber-950/40 px-2.5 py-0.5 text-[10px] font-black text-amber-200">
          ⬦ {props.ascensionFragments} de Éter
        </span>
        <button
          type="button"
          aria-label={`Reasignar el árbol de ${props.champion.displayName}`}
          disabled={props.isBusy || investedNodes.length === 0}
          onClick={props.onRespec}
          className="ml-auto h-9 rounded-lg border border-violet-500/50 px-3 text-[10px] font-black uppercase tracking-wider text-violet-200 transition hover:bg-violet-900/40 disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300"
        >
          Reasignar
        </button>
      </div>

      <div className="grid gap-2 md:grid-cols-3">
        {branches.map((branch) => {
          const nodes = props.champion.nodes.filter((node) => node.branch === branch);
          return (
            <div key={branch} className={`rounded-xl border bg-[#0d0616]/70 p-2 ${BRANCH_ACCENT[branch]}`}>
              <p className="mb-1.5 text-[10px] font-black uppercase tracking-[0.2em]">{BRANCH_LABEL[branch]}</p>
              {nodes.length === 0 ? (
                <p className="py-2 text-center text-[10px] text-slate-600">Sin nodos</p>
              ) : (
                <ul className="space-y-1.5">
                  {nodes.map((node) => {
                    const state = resolveState(node);
                    const isOwned = state.kind === "owned";
                    const isAvailable = state.kind === "available";
                    return (
                      <li key={node.id}>
                        <button
                          type="button"
                          disabled={props.isBusy || !isAvailable}
                          aria-label={isAvailable
                            ? `Comprar ${describeEffect(node.effect)} por ${node.fragmentCost} de Éter`
                            : `${describeEffect(node.effect)}: ${isOwned ? "ya comprado" : state.reason}`}
                          title={describeCap(node.effect)}
                          onClick={() => props.onPurchase(node.id)}
                          className={`flex min-h-[44px] w-full flex-col gap-0.5 rounded-lg border p-2 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300 ${
                            isOwned
                              ? "border-emerald-500/50 bg-emerald-950/30"
                              : isAvailable
                                ? "border-amber-400/50 bg-amber-950/20 hover:bg-amber-900/30"
                                : "cursor-not-allowed border-slate-800/70 bg-slate-950/60"
                          }`}
                        >
                          <span className="flex w-full items-center gap-2">
                            <span className={`flex-1 text-[10.5px] leading-snug ${isOwned || isAvailable ? "text-slate-200" : "text-slate-400"}`}>
                              {describeEffect(node.effect)}
                            </span>
                            <span className={`shrink-0 text-[10px] font-black ${
                              isOwned ? "text-emerald-300" : state.kind === "expensive" ? "text-rose-300" : "text-amber-300"
                            }`}>
                              {isOwned ? "✓" : `${node.fragmentCost} ⬦`}
                            </span>
                          </span>
                          {/* El motivo del bloqueo se lee sin pasar el ratón: en móvil no hay hover. */}
                          {!isOwned && !isAvailable ? (
                            <span className={`text-[9.5px] leading-tight ${state.kind === "expensive" ? "text-rose-300/90" : "text-slate-500"}`}>
                              {state.kind === "expensive" ? "◆ " : "🔒 "}{state.reason}
                            </span>
                          ) : null}
                          <span className="text-[9px] text-slate-600">{describeCap(node.effect)}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </div>
      <p className="mt-2 text-[10px] text-slate-500">
        Las cartas prestadas no ganan experiencia ni entran en tu colección: las mejoras viven en el campeón.
      </p>
    </section>
  );
}
