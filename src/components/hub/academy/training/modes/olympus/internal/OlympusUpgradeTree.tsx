// src/components/hub/academy/training/modes/olympus/internal/OlympusUpgradeTree.tsx - Árbol de mejoras acumulables del campeón.
"use client";
import { IOlympusUpgradeEffect, IOlympusUpgradeNode, OlympusUpgradeBranch } from "@/core/entities/olympus/IOlympus";
import { resolveNextRankCost } from "@/core/services/olympus/resolve-respec-quote";
import { IOlympusChampionCard } from "../olympus-api-client";
import { EterIcon } from "../../EterIcon";

interface IOlympusUpgradeTreeProps {
  champion: IOlympusChampionCard;
  ascensionFragments: number;
  isBusy: boolean;
  onPurchase: (nodeId: string) => void;
  onRespec: () => void;
}

const BRANCH: Record<OlympusUpgradeBranch, { label: string; ring: string; fill: string; text: string }> = {
  POWER: { label: "Potencia", ring: "border-rose-500/40", fill: "from-rose-500 to-orange-400", text: "text-rose-300" },
  RESILIENCE: { label: "Resistencia", ring: "border-sky-500/40", fill: "from-sky-500 to-cyan-300", text: "text-sky-300" },
  IDENTITY: { label: "Identidad", ring: "border-amber-400/40", fill: "from-amber-400 to-violet-400", text: "text-amber-300" },
};

/** Lo que el jugador nota en combate por cada rango, no el nombre interno del `kind`. */
function describeEffect(effect: IOlympusUpgradeEffect): { gain: string; attribute: string } {
  switch (effect.kind) {
    case "GLOBAL_LEVEL": return { gain: `+${effect.amount} nivel`, attribute: "a todo el mazo" };
    case "GLOBAL_VERSION_TIER": return { gain: `+${effect.amount} versión`, attribute: "a todo el mazo" };
    case "SIGNATURE_CARD_LEVEL": return { gain: `+${effect.amount} nivel`, attribute: "a tus emblemáticas" };
    case "STARTING_LP": return { gain: `+${effect.amount} LP`, attribute: "iniciales" };
    case "STARTING_ENERGY": return { gain: `+${effect.amount} energía`, attribute: "máxima" };
  }
}

export function OlympusUpgradeTree(props: IOlympusUpgradeTreeProps) {
  const ranks = props.champion.progress?.nodeRanks ?? {};
  const branches = Object.keys(BRANCH) as OlympusUpgradeBranch[];
  const hasInvested = Object.values(ranks).some((rank) => rank > 0);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {/* El saldo va aquí porque es donde se gasta: mirar la cabecera para saber si llega es un viaje de más. */}
        <span
          className="flex items-center gap-1.5 rounded-lg border border-amber-400/50 bg-amber-950/25 px-2.5 py-1"
          aria-label={`Tienes ${props.ascensionFragments} de Éter`}
        >
          <EterIcon size={16} />
          <span className="font-display text-sm font-black tabular-nums text-amber-200">{props.ascensionFragments}</span>
          <span className="text-[9px] font-bold uppercase tracking-wider text-amber-400/70">Éter</span>
        </span>
        <p className="font-display text-[11px] font-black uppercase tracking-[0.2em] text-violet-300/80">
          Cada mejora sube por rangos y se acumula
        </p>
        <button
          type="button"
          aria-label={`Reasignar el árbol de ${props.champion.displayName}`}
          disabled={props.isBusy || !hasInvested}
          onClick={props.onRespec}
          className="ml-auto h-9 rounded-lg border border-violet-500/50 px-3 font-display text-[10px] font-black uppercase tracking-wider text-violet-200 transition hover:bg-violet-900/40 disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300"
        >
          Reasignar
        </button>
      </div>

      <div className="grid gap-2.5 md:grid-cols-3">
        {branches.map((branch) => {
          const theme = BRANCH[branch];
          const nodes = props.champion.nodes.filter((node) => node.branch === branch);
          return (
            <section key={branch} className={`rounded-xl border ${theme.ring} bg-[#0d0616]/70 p-2.5`}>
              <h3 className={`mb-2 font-display text-[10px] font-black uppercase tracking-[0.24em] ${theme.text}`}>
                {theme.label}
              </h3>
              {nodes.length === 0 ? (
                <p className="py-3 text-center text-[10px] text-slate-600">Sin nodos</p>
              ) : (
                <ul className="space-y-2">
                  {nodes.map((node) => (
                    <UpgradeNodeRow
                      key={node.id}
                      node={node}
                      rank={ranks[node.id] ?? 0}
                      unlockedNodeIds={props.champion.progress?.unlockedNodeIds ?? []}
                      ascensionFragments={props.ascensionFragments}
                      isBusy={props.isBusy}
                      fill={theme.fill}
                      onPurchase={props.onPurchase}
                    />
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>
      <p className="text-[10px] text-slate-500">
        Las cartas prestadas no ganan experiencia ni entran en tu colección: las mejoras viven en el campeón.
      </p>
    </div>
  );
}

function UpgradeNodeRow({ node, rank, unlockedNodeIds, ascensionFragments, isBusy, fill, onPurchase }: {
  node: IOlympusUpgradeNode;
  rank: number;
  unlockedNodeIds: string[];
  ascensionFragments: number;
  isBusy: boolean;
  fill: string;
  onPurchase: (nodeId: string) => void;
}) {
  const effect = describeEffect(node.effect);
  const isMaxed = rank >= node.maxRank;
  const nextCost = resolveNextRankCost(node.fragmentCost, rank);
  const missingPrerequisite = rank === 0 && node.prerequisiteNodeIds.some((id) => !unlockedNodeIds.includes(id));
  const canAfford = ascensionFragments >= nextCost;
  const canBuy = !isMaxed && !missingPrerequisite && canAfford;
  // El total acumulado es lo que de verdad le importa al jugador: cuánto lleva ganado en este nodo.
  const accumulated = node.effect.amount * rank;

  return (
    <li className="rounded-lg border border-slate-800/70 bg-slate-950/50 p-2">
      <div className="flex items-baseline gap-1.5">
        <span className="font-display text-sm font-black text-slate-100">{effect.gain}</span>
        <span className="text-[10px] text-slate-500">{effect.attribute}</span>
        <span className="ml-auto font-display text-[10px] font-black tabular-nums text-slate-400">
          {rank}<span className="text-slate-600">/{node.maxRank}</span>
        </span>
      </div>

      {/* Barra de rangos: se lee de un vistazo cuánto queda por invertir en este nodo. */}
      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-900">
        <div className={`h-full rounded-full bg-gradient-to-r ${fill} transition-all duration-500`} style={{ width: `${(rank / node.maxRank) * 100}%` }} />
      </div>

      <div className="mt-1.5 flex items-center gap-2">
        <span className="text-[10px] text-slate-500">
          {accumulated > 0 ? `Llevas ${node.effect.amount > 0 ? "+" : ""}${accumulated}` : "Sin invertir"}
        </span>
        <button
          type="button"
          disabled={isBusy || !canBuy}
          aria-label={isMaxed
            ? `${effect.gain} ${effect.attribute}: rango máximo alcanzado`
            : `Subir ${effect.gain} ${effect.attribute} al rango ${rank + 1} por ${nextCost} de Éter`}
          onClick={() => onPurchase(node.id)}
          className={`ml-auto flex min-h-[34px] items-center gap-1 rounded-lg border px-2.5 font-display text-[11px] font-black transition ${
            isMaxed
              ? "cursor-default border-emerald-600/40 bg-emerald-950/30 text-emerald-300"
              : canBuy
                ? "border-amber-400/60 bg-amber-950/30 text-amber-200 hover:bg-amber-900/40"
                : "cursor-not-allowed border-slate-800 bg-slate-950 text-slate-600"
          }`}
        >
          {isMaxed ? "MÁX" : <><EterIcon size={14} /> {nextCost}</>}
        </button>
      </div>

      {/* Un nodo bloqueado dice POR QUÉ: no es lo mismo que falte Éter que un nodo previo. */}
      {!isMaxed && missingPrerequisite ? (
        <p className="mt-1 text-[9.5px] text-slate-500">🔒 Necesitas antes otro nodo de esta rama</p>
      ) : null}
      {!isMaxed && !missingPrerequisite && !canAfford ? (
        <p className="mt-1 flex items-center gap-1 text-[9.5px] text-rose-300/90">
          <EterIcon size={11} /> Te falta {nextCost - ascensionFragments} de Éter
        </p>
      ) : null}
    </li>
  );
}
