// src/components/hub/academy/training/modes/olympus/internal/OlympusLegendSelector.tsx - Carrusel de leyendas: una en escena, con flechas para pasar entre ellas.
"use client";
import Image from "next/image";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Coins, Heart, ShieldCheck, Zap } from "lucide-react";
import { IOlympusLegendCard } from "../olympus-api-client";
import { EterIcon } from "../../EterIcon";
import { describeAiProfile } from "./olympus-labels";

interface IOlympusLegendSelectorProps {
  legends: IOlympusLegendCard[];
  defeatedLegendIds: string[];
  selectedId: string | null;
  onSelect: (opponentId: string) => void;
}

/**
 * Una leyenda cada vez y a pantalla grande: pasar de rival es un gesto, no una lista que compite
 * consigo misma. Las reglas del duelo se ven en el lobby y en la confirmación, así que aquí sobran.
 */
export function OlympusLegendSelector({ legends, defeatedLegendIds, selectedId, onSelect }: IOlympusLegendSelectorProps) {
  if (legends.length === 0) return null;

  const currentIndex = Math.max(0, legends.findIndex((legend) => legend.id === selectedId));
  const legend = legends[currentIndex];
  const isDefeated = defeatedLegendIds.includes(legend.id);
  // Resuelto en servidor contra `cards_catalog`: el catálogo de código no conoce las cartas del panel.
  const rewardCard = legend.rewardCard;
  // El carrusel es circular: desde la última se vuelve a la primera sin callejón sin salida.
  const step = (offset: number) => onSelect(legends[(currentIndex + offset + legends.length) % legends.length].id);

  return (
    <section aria-labelledby="olympus-legends-title" aria-roledescription="carrusel">
      <div className="mb-1.5 flex items-center gap-2">
        <h2 id="olympus-legends-title" className="font-display text-[11px] font-black uppercase tracking-[0.28em] text-violet-300/80">
          Tu rival legendario
        </h2>
        <span className="ml-auto font-display text-[10px] font-black tabular-nums text-violet-400/70">
          {currentIndex + 1}/{legends.length}
        </span>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-amber-300/60 shadow-[0_0_32px_rgba(168,85,247,0.24)]">
        <div className="relative h-52 w-full bg-[#0d0616] md:h-72">
          {legend.introPath ?? legend.avatarPath ? (
            // `key` por leyenda: al cambiar de rival el retrato se remonta y vuelve a entrar en escena.
            <motion.span
              key={legend.id}
              initial={{ opacity: 0, scale: 1.08 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
              className="absolute inset-0 block"
            >
              <Image
                src={(legend.introPath ?? legend.avatarPath) as string}
                alt=""
                fill
                sizes="(min-width: 768px) 900px, 100vw"
                unoptimized
                className="object-cover object-top saturate-125"
              />
            </motion.span>
          ) : null}
          <span aria-hidden className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,5,19,0.2),rgba(10,5,19,0.45)_50%,#120a1e)]" />
          <span aria-hidden className="absolute inset-0 bg-[radial-gradient(circle_at_18%_120%,rgba(251,191,36,0.28),transparent_55%)]" />

          <span className="absolute right-2 top-2">
            {isDefeated ? (
              <span className="flex items-center gap-1 rounded-full border border-emerald-400/60 bg-emerald-950/85 px-2 py-0.5 font-display text-[9px] font-black uppercase tracking-wider text-emerald-300">
                <ShieldCheck aria-hidden size={10} /> Vencida
              </span>
            ) : (
              // Sin la palabra «Éter» el número no dice nada: aquí es donde el jugador aprende la moneda.
              <span className="flex items-center gap-1 rounded-full border border-amber-300/60 bg-amber-950/85 px-2 py-0.5 font-display text-[9px] font-black uppercase tracking-wider text-amber-200">
                <EterIcon size={13} /> +{legend.firstVictoryFragmentBonus} Éter por la 1ª victoria
              </span>
            )}
          </span>

          <div className="absolute inset-x-12 bottom-2 text-center">
            <p className="truncate font-display text-2xl font-black uppercase italic leading-none tracking-tight text-amber-50 md:text-5xl">
              {legend.displayName}
            </p>
            <p className="mt-1 font-display text-[9.5px] font-black uppercase tracking-[0.24em] text-violet-300/90">
              IA {describeAiProfile(legend.aiProfile)}
            </p>
          </div>

          <ArrowButton side="left" label="Ver la leyenda anterior" onClick={() => step(-1)} />
          <ArrowButton side="right" label="Ver la siguiente leyenda" onClick={() => step(1)} />
        </div>

        <div className="space-y-2 bg-[#120a1e]/95 p-3">
          <div className="flex flex-wrap justify-center gap-1.5">
            <StatChip icon={<Heart aria-hidden size={12} />} label="LP" value={legend.startingLp.toLocaleString("es-ES")} tone="border-rose-500/40 text-rose-200" />
            {legend.energyBonus > 0 ? (
              <StatChip icon={<Zap aria-hidden size={12} />} label="Energía" value={`+${legend.energyBonus}`} tone="border-sky-500/40 text-sky-200" />
            ) : null}
            <StatChip icon={<EterIcon size={15} />} label="Si ganas" value={String(legend.baseFragmentReward)} tone="border-amber-400/40 text-amber-200" />
            {legend.nexusReward > 0 ? (
              <StatChip icon={<Coins aria-hidden size={12} />} label="Nexus" value={String(legend.nexusReward)} tone="border-emerald-500/40 text-emerald-200" />
            ) : null}
            <StatChip icon={<EterIcon size={15} className="opacity-50" />} label="Si pierdes" value={String(legend.defeatFragmentReward)} tone="border-slate-600/60 text-slate-400" />
          </div>

          {/* La carta de botín se anuncia ANTES de gastar el intento: es el motivo de venir aquí. */}
          {rewardCard ? (
            <p className="flex items-center justify-center gap-1.5 rounded-lg border border-amber-400/40 bg-amber-950/25 px-2 py-1.5 text-center text-[11px] text-amber-100">
              {rewardCard.renderUrl ? (
                <Image src={rewardCard.renderUrl} alt="" width={22} height={22} unoptimized
                  className="h-6 w-6 rounded border border-amber-300/40 object-cover" />
              ) : null}
              <span className="font-display text-[10px] font-black uppercase tracking-wider">
                {legend.cardRewardFirstVictoryOnly ? "1ª victoria" : "Cada victoria"}
              </span>
              · {rewardCard.name}
            </p>
          ) : null}

          {legend.lore ? (
            <p className="text-center text-[11.5px] italic leading-relaxed text-slate-400">{legend.lore}</p>
          ) : null}

          {/* Los puntos dan salto directo y, de paso, dicen cuántas leyendas hay sin contar tarjetas. */}
          {legends.length > 1 ? (
            <div className="flex justify-center gap-1.5 pt-0.5">
              {legends.map((candidate, index) => (
                <button
                  key={candidate.id}
                  type="button"
                  aria-label={`Ir a ${candidate.displayName}`}
                  aria-current={index === currentIndex}
                  onClick={() => onSelect(candidate.id)}
                  className={`h-2 rounded-full transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300 ${
                    index === currentIndex ? "w-6 bg-[linear-gradient(90deg,#fde68a,#c084fc)]" : "w-2 bg-slate-700 hover:bg-slate-500"
                  }`}
                />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function ArrowButton({ side, label, onClick }: { side: "left" | "right"; label: string; onClick: () => void }) {
  const Icon = side === "left" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      // Clases completas por lado: Tailwind no ve los nombres construidos en tiempo de ejecución.
      className={`absolute top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-amber-300/50 bg-[#0a0513]/75 text-amber-200 backdrop-blur transition hover:bg-amber-950/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300 ${
        side === "left" ? "left-1.5" : "right-1.5"
      }`}
    >
      <Icon aria-hidden size={22} />
    </button>
  );
}

function StatChip({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone: string }) {
  return (
    <span className={`flex items-center gap-1.5 rounded-lg border bg-slate-950/60 px-2 py-1 ${tone}`}>
      {icon}
      <span className="text-[9px] font-bold uppercase tracking-wider opacity-70">{label}</span>
      <span className="font-display text-[12px] font-black tabular-nums">{value}</span>
    </span>
  );
}
