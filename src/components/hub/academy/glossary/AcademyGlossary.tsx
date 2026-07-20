// src/components/hub/academy/glossary/AcademyGlossary.tsx
// Códex/Glosario para novatos: documentación navegable por secciones con estética del juego,
// tipografía legible, cartas reales de ejemplo y visualizaciones animadas (framer-motion).
// Los DATOS salen de las fuentes de verdad; la PROSA de glossary-content. Cero balance duplicado.
"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import { Card } from "@/components/game/card/Card";
import { CardType, ICard } from "@/core/entities/ICard";
import { AcademyBackButton } from "@/components/hub/academy/AcademyBackButton";
import { ACADEMY_HOME_ROUTE } from "@/core/constants/routes/academy-routes";
import { EFFECT_CATALOG } from "@/core/services/effects/effect-catalog";
import { EffectCategory, IEffectCatalogItem } from "@/core/services/effects/effect-catalog-types";
import { CARD_LEVEL_MILESTONES, MAX_LEVEL_ART_LEVEL, resolveCardLevelBonuses } from "@/core/services/progression/card-level-bonus-rules";
import { getCopiesNeededForNextVersion, MAX_CARD_VERSION_TIER } from "@/core/services/progression/card-version-rules";
import { CARD_CATALOG } from "@/infrastructure/repositories/internal/card-catalog";
import { STORY_OPPONENT_NARRATION_CATALOG } from "@/services/story/story-opponent-narration-catalog";
import { RANKING_SCORING_GUIDES, RANKING_SCORING_ORDER } from "@/services/ranking/ranking-scoring";
import { EffectVfxDemo } from "./EffectVfxDemo";
import {
  CARD_TYPE_GUIDE,
  type IStoryFaction,
  MASTERY_INTRO,
  OPPONENT_BIOS,
  OPPONENT_ORDER,
  RANKINGS_INTRO,
  SKILL_TREE_INTRO,
  STORY_FACTIONS,
  STORY_HERO,
  STORY_LORE_INTRO,
  STORY_OVERVIEW,
  STORY_THREAT,
  VERSION_INTRO,
  XP_INTRO,
} from "./glossary-content";

type SectionId = "types" | "effects" | "levels" | "versions" | "mastery" | "skilltree" | "rankings" | "story" | "opponents";

const SECTIONS: { id: SectionId; label: string }[] = [
  { id: "types", label: "Tipos de carta" },
  { id: "effects", label: "Efectos" },
  { id: "levels", label: "Niveles y XP" },
  { id: "versions", label: "Versiones" },
  { id: "mastery", label: "Pasivas de maestría" },
  { id: "skilltree", label: "Árbol de Operador" },
  { id: "rankings", label: "Rankings" },
  { id: "story", label: "Historia" },
  { id: "opponents", label: "Oponentes" },
];

const SKILL_TREE_BRANCHES = [
  { name: "Economía", accent: "text-amber-300", box: "border-amber-400/35 bg-amber-400/5", scope: "Todos los modos", desc: "Más Nexus y experiencia por duelo." },
  { name: "Combate", accent: "text-cyan-300", box: "border-cyan-400/35 bg-cyan-400/5", scope: "Solo Historia y Arena", desc: "Más LP iniciales, más techo de energía y energía extra en tu primer turno." },
  { name: "Arsenal", accent: "text-violet-300", box: "border-violet-400/35 bg-violet-400/5", scope: "Utilidad", desc: "Mejoras de meta-juego (más experiencia y, más adelante, otras)." },
];

const EFFECT_GROUPS: { category: EffectCategory; label: string; accent: string }[] = [
  { category: "EXECUTION", label: "Efectos de Magia", accent: "text-sky-300" },
  { category: "TRAP", label: "Efectos de Trampa", accent: "text-fuchsia-300" },
  { category: "ENTITY", label: "Poderes innatos de Entity", accent: "text-amber-300" },
  { category: "TRAP_TRIGGER", label: "Disparadores de Trampa", accent: "text-fuchsia-200" },
];

const HEADING_FONT = { fontFamily: "var(--font-orbitron)" } as const;
// Fuente narrativa (sci-fi) para la prosa del lore/Historia; da carácter sin perder legibilidad.
const NARRATIVE_FONT = { fontFamily: "var(--font-narrative)" } as const;

// Mapa efecto/pasiva/trigger → primera carta real que lo usa (para mostrarla como ejemplo).
const EXAMPLE_CARD_BY_KEY: Map<string, ICard> = (() => {
  const map = new Map<string, ICard>();
  const register = (key: string | null | undefined, card: ICard) => {
    if (key && !map.has(key)) map.set(key, card);
  };
  for (const card of CARD_CATALOG) {
    register(card.effect?.action, card);
    register(card.masteryPassiveSkillId, card);
    register(card.trigger, card);
  }
  return map;
})();

function resolveExampleCard(key: string): ICard | undefined {
  return EXAMPLE_CARD_BY_KEY.get(key);
}

// Carta genérica de respaldo para pasivas que ninguna carta lleva de forma innata
// (Núcleo Defensivo / Turbo Ofensivo): son pasivas de maestría que cualquier carta puede obtener.
const GENERIC_ENTITY_EXAMPLE = CARD_CATALOG.find((card) => card.type === "ENTITY");

interface IMasteryExample {
  card?: ICard;
  isGeneric: boolean;
}

function resolveMasteryExample(key: string): IMasteryExample {
  const innate = resolveExampleCard(key);
  if (innate) return { card: innate, isGeneric: false };
  return { card: GENERIC_ENTITY_EXAMPLE, isGeneric: true };
}

// --- Piezas reutilizables ---

/** Renderiza una <Card> real a escala reducida para usarla como ejemplo. */
function ScaledCard({ card, scale = 0.66 }: { card: ICard; scale?: number }) {
  return (
    <div style={{ width: 260 * scale, height: 380 * scale }} className="shrink-0">
      <div style={{ transform: `scale(${scale})`, transformOrigin: "top left" }}>
        <Card
          card={card}
          isPerformanceMode
          showBackgroundInPerformanceMode
          disableHoverEffects
          disableHologram
          disableDefaultShadow
        />
      </div>
    </div>
  );
}

/** Barra de progreso estilo carta (track cian) con relleno animado. */
function ProgressBar({ pct, delay = 0, tall = false }: { pct: number; delay?: number; tall?: boolean }) {
  return (
    <div className={`relative w-full overflow-hidden rounded-full border border-cyan-900/60 bg-black shadow-[inset_0_0_6px_rgba(0,0,0,0.85)] ${tall ? "h-3" : "h-2"}`}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.9, delay, ease: "easeOut" }}
        className="absolute left-0 top-0 h-full rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.85)]"
      />
    </div>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-cyan-400/25 bg-[#04121d]/70 p-5 shadow-[0_0_28px_rgba(34,211,238,0.08)] sm:p-7">
      {children}
    </div>
  );
}

function SectionHeading({ kicker, title, intro }: { kicker: string; title: string; intro?: string[] }) {
  return (
    <header className="mb-6">
      <p className="text-xs font-bold uppercase tracking-[0.3em] text-cyan-400/80">{kicker}</p>
      <h2 className="mt-1.5 text-3xl font-black text-white sm:text-4xl" style={HEADING_FONT}>
        {title}
      </h2>
      {intro?.map((paragraph) => (
        <p key={paragraph} className="mt-3 max-w-3xl text-[15px] leading-7 text-slate-300">
          {paragraph}
        </p>
      ))}
    </header>
  );
}

const listStagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};
const itemFade: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
};

// --- Secciones ---

function TypesSection({ examples }: { examples: Partial<Record<CardType, ICard>> }) {
  return (
    <Panel>
      <SectionHeading
        kicker="Fundamentos"
        title="Tipos de carta"
        intro={["Cada carta pertenece a un tipo, y cada tipo se juega distinto. Estos son ejemplos reales del juego."]}
      />
      <motion.div variants={listStagger} initial="hidden" animate="show" className="space-y-4">
        {CARD_TYPE_GUIDE.map((guide) => {
          const example = examples[guide.type];
          return (
            <motion.div
              key={guide.type}
              variants={itemFade}
              className="flex flex-col gap-4 rounded-2xl border border-slate-700/70 bg-slate-950/50 p-4 sm:flex-row sm:items-center"
            >
              {example ? (
                <div className="mx-auto sm:mx-0">
                  <ScaledCard card={example} />
                </div>
              ) : null}
              <div className="min-w-0 flex-1">
                <h3 className={`text-xl font-black ${guide.accent}`} style={HEADING_FONT}>
                  {guide.name}
                </h3>
                <p className="mt-1 text-[15px] font-semibold text-slate-100">{guide.tagline}</p>
                <ul className="mt-3 space-y-2">
                  {guide.points.map((point) => (
                    <li key={point} className="flex gap-2.5 text-[14px] leading-6 text-slate-300">
                      <span className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-current ${guide.accent}`} />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </Panel>
  );
}

function EffectItemButton({ item, onSelect }: { item: IEffectCatalogItem; onSelect: (item: IEffectCatalogItem) => void }) {
  const hasExample = Boolean(resolveExampleCard(item.key));
  return (
    <motion.li variants={itemFade}>
      <button
        type="button"
        onClick={() => onSelect(item)}
        className="group flex h-full w-full flex-col rounded-xl border border-slate-700/70 bg-slate-950/50 p-3.5 text-left transition-colors hover:border-cyan-400/50 hover:bg-slate-900/60"
      >
        <span className="flex items-center justify-between gap-2">
          <span className="text-[15px] font-bold text-cyan-100">{item.name}</span>
          {hasExample ? <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-400/70 opacity-0 transition-opacity group-hover:opacity-100">Ver ejemplo</span> : null}
        </span>
        <span className="mt-1 text-[13.5px] leading-6 text-slate-300">{item.description}</span>
      </button>
    </motion.li>
  );
}

function EffectsSection({ onSelect }: { onSelect: (item: IEffectCatalogItem) => void }) {
  const groups = useMemo(
    () =>
      EFFECT_GROUPS.map((group) => ({
        ...group,
        items: EFFECT_CATALOG.filter((item) => item.category === group.category),
      })).filter((group) => group.items.length > 0),
    [],
  );
  return (
    <Panel>
      <SectionHeading
        kicker="Combate"
        title="Efectos"
        intro={[
          "Qué hace cada efecto que ves en pantalla. Toca cualquiera para ver una carta real que lo usa como ejemplo.",
        ]}
      />
      <div className="space-y-8">
        {groups.map((group) => (
          <section key={group.category}>
            <div className="mb-3 flex items-center gap-3">
              <h3 className={`text-sm font-black uppercase tracking-[0.18em] ${group.accent}`}>{group.label}</h3>
              <span className="text-xs font-bold text-slate-500">{group.items.length}</span>
              <div className="h-px flex-1 bg-gradient-to-r from-cyan-400/30 to-transparent" />
            </div>
            <motion.ul variants={listStagger} initial="hidden" animate="show" className="grid gap-2.5 md:grid-cols-2">
              {group.items.map((item) => (
                <EffectItemButton key={item.key} item={item} onSelect={onSelect} />
              ))}
            </motion.ul>
          </section>
        ))}
      </div>
    </Panel>
  );
}

// Los hitos salen de la MISMA tabla que usa el motor (card-level-bonus-rules): así el Códex no puede quedarse
// mintiendo si mañana se retoca la curva.
const LEVEL_MILESTONES = CARD_LEVEL_MILESTONES.map((milestone) => milestone.level);
const LEVEL_TRACK_MAX = MAX_LEVEL_ART_LEVEL;

function describeLevelDelta(level: number): string[] {
  const current = resolveCardLevelBonuses("ENTITY", level);
  const previous = resolveCardLevelBonuses("ENTITY", level - 1);
  const parts: string[] = [];
  if (current.attackBonus - previous.attackBonus > 0) parts.push(`+${current.attackBonus - previous.attackBonus} ATAQUE`);
  if (current.defenseBonus - previous.defenseBonus > 0) parts.push(`+${current.defenseBonus - previous.defenseBonus} DEFENSA`);
  if (current.energyCostReduction - previous.energyCostReduction > 0) parts.push(`−1 coste de energía`);
  return parts;
}

function LevelsSection() {
  const milestones = useMemo(
    () => LEVEL_MILESTONES.map((level) => ({ level, effects: describeLevelDelta(level) })).filter((m) => m.effects.length > 0),
    [],
  );
  return (
    <Panel>
      <SectionHeading kicker="Progresión" title="Niveles y experiencia" intro={XP_INTRO} />

      {/* Barra de XP animada (misma estética que la de las cartas) con hitos marcados. */}
      <div className="relative mb-8 mt-2 px-2">
        <div className="mb-2 flex items-center gap-2">
          <span className="text-xs font-black italic text-cyan-300">LVL 1</span>
          <div className="flex-1">
            <ProgressBar pct={100} tall />
          </div>
          <span className="text-xs font-black italic text-cyan-300">LVL {LEVEL_TRACK_MAX}</span>
        </div>
        <div className="relative h-4">
          {milestones.map((m) => (
            <div key={m.level} className="absolute -translate-x-1/2" style={{ left: `${(m.level / LEVEL_TRACK_MAX) * 100}%` }}>
              <span className="block h-2 w-0.5 bg-cyan-300/70" />
              <span className="mt-0.5 block text-[10px] font-black text-cyan-200">{m.level}</span>
            </div>
          ))}
        </div>
      </div>

      <motion.div variants={listStagger} initial="hidden" animate="show" className="grid gap-3 sm:grid-cols-2">
        {milestones.map((milestone) => (
          <motion.div
            key={milestone.level}
            variants={itemFade}
            className="flex items-center gap-4 rounded-2xl border border-cyan-400/25 bg-slate-950/50 p-4"
          >
            <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-xl border border-cyan-300/40 bg-cyan-400/10">
              <span className="text-[9px] font-black uppercase tracking-widest text-cyan-300/80">Nivel</span>
              <span className="text-2xl font-black text-white">{milestone.level}</span>
            </div>
            <ul className="space-y-1">
              {milestone.effects.map((effect) => (
                <li key={effect} className="text-[15px] font-black text-emerald-300">
                  {effect}
                </li>
              ))}
            </ul>
          </motion.div>
        ))}
      </motion.div>
      <p className="mt-5 text-[14px] leading-6 text-slate-400">
        Solo las Entity acumulan estas bonificaciones de combate; el resto de cartas también reducen su coste de energía al máximo nivel.
      </p>
    </Panel>
  );
}

function VersionsSection() {
  const steps = useMemo(() => {
    const raw = Array.from({ length: MAX_CARD_VERSION_TIER }, (_, tier) => ({
      from: tier,
      to: tier + 1,
      copies: getCopiesNeededForNextVersion(tier) ?? 0,
    }));
    const max = Math.max(...raw.map((step) => step.copies), 1);
    return raw.map((step) => ({ ...step, pct: (step.copies / max) * 100 }));
  }, []);
  return (
    <Panel>
      <SectionHeading kicker="Evolución" title={`Versiones V0 – V${MAX_CARD_VERSION_TIER}`} intro={VERSION_INTRO} />
      <motion.div variants={listStagger} initial="hidden" animate="show" className="space-y-3">
        {steps.map((step, index) => (
          <motion.div key={step.to} variants={itemFade} className="flex items-center gap-4 rounded-xl border border-slate-700/70 bg-slate-950/50 p-3.5">
            <span className="w-20 shrink-0 text-sm font-black text-cyan-100" style={HEADING_FONT}>
              V{step.from} <span className="text-cyan-400">→</span> V{step.to}
            </span>
            <div className="flex-1">
              <ProgressBar pct={step.pct} delay={index * 0.08} />
            </div>
            <span className="w-24 shrink-0 text-right text-sm font-bold text-slate-200">
              <span className="text-lg font-black text-white">{step.copies}</span> copias
            </span>
          </motion.div>
        ))}
      </motion.div>
      <div className="mt-4 rounded-xl border border-emerald-400/40 bg-emerald-400/10 p-4 text-center">
        <span className="text-lg font-black text-emerald-300" style={HEADING_FONT}>
          V{MAX_CARD_VERSION_TIER}
        </span>
        <span className="ml-2 text-[14px] font-semibold text-emerald-200">Forma máxima — el poder de la carta alcanza su valor pleno.</span>
      </div>
    </Panel>
  );
}

function MasterySection({ onSelect }: { onSelect: (item: IEffectCatalogItem) => void }) {
  const passives = useMemo(() => EFFECT_CATALOG.filter((item) => item.category === "PASSIVE"), []);
  return (
    <Panel>
      <SectionHeading kicker="Poderes" title="Pasivas de maestría" intro={MASTERY_INTRO} />
      <motion.ul variants={listStagger} initial="hidden" animate="show" className="grid gap-2.5 md:grid-cols-2">
        {passives.map((passive) => {
          const { card: example, isGeneric } = resolveMasteryExample(passive.key);
          return (
            <motion.li key={passive.key} variants={itemFade}>
              <button
                type="button"
                onClick={() => onSelect(passive)}
                className="group flex h-full w-full gap-3 rounded-xl border border-slate-700/70 bg-slate-950/50 p-3.5 text-left transition-colors hover:border-cyan-400/50 hover:bg-slate-900/60"
              >
                {example ? (
                  <div className="shrink-0">
                    <ScaledCard card={example} scale={0.4} />
                  </div>
                ) : null}
                <span className="min-w-0">
                  <span className="block text-[15px] font-black text-cyan-200" style={HEADING_FONT}>
                    {passive.name}
                  </span>
                  <span className="mt-1 block text-[13.5px] leading-6 text-slate-300">{passive.description}</span>
                  <span className="mt-1.5 block text-[11px] font-bold uppercase tracking-wider text-cyan-400/60">
                    {isGeneric ? "Genérica · cualquier carta puede obtenerla" : `Innata · ${example?.name ?? ""}`}
                  </span>
                </span>
              </button>
            </motion.li>
          );
        })}
      </motion.ul>
      <p className="mt-5 text-[14px] leading-6 text-slate-400">
        Los valores mostrados son los de la versión máxima (V5). En versiones inferiores la magnitud es menor y crece al evolucionar la carta.
      </p>
    </Panel>
  );
}

function SkillTreeSection() {
  return (
    <Panel>
      <SectionHeading kicker="Progresión" title="Árbol de Operador" intro={SKILL_TREE_INTRO} />
      <motion.div variants={listStagger} initial="hidden" animate="show" className="grid gap-3 sm:grid-cols-3">
        {SKILL_TREE_BRANCHES.map((branch) => (
          <motion.div key={branch.name} variants={itemFade} className={`rounded-2xl border p-4 ${branch.box}`}>
            <h3 className={`text-lg font-black ${branch.accent}`} style={HEADING_FONT}>
              {branch.name}
            </h3>
            <span className={`mt-1 inline-block rounded-md border px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${branch.accent}`} style={{ borderColor: "currentColor" }}>
              {branch.scope}
            </span>
            <p className="mt-2.5 text-[13.5px] leading-6 text-slate-300">{branch.desc}</p>
          </motion.div>
        ))}
      </motion.div>
      <div className="mt-5 rounded-xl border border-cyan-400/30 bg-cyan-400/5 p-4">
        <p className="text-[13.5px] leading-6 text-cyan-100/90">
          Recuerda: las ventajas de la rama de <span className="font-black text-cyan-300">Combate</span> solo tienen efecto en
          Historia y Arena. En Multijugador todos compiten en igualdad de condiciones.
        </p>
      </div>
      <div className="mt-3 rounded-xl border border-violet-400/30 bg-violet-400/5 p-4">
        <p className="text-[13.5px] leading-6 text-violet-100/90">
          <span className="font-black text-violet-300">Reasignar (respec):</span> con la habilidad{" "}
          <span className="font-black text-violet-200">Reasignación</span> (rama Arsenal) puedes reiniciar el árbol y
          recuperar todos tus puntos para repartirlos de nuevo. El reset borra también esa habilidad, así que para
          volver a reasignar tendrás que recomprarla. Tu nivel y tu XP nunca cambian.
        </p>
      </div>
    </Panel>
  );
}

function RankingsSection() {
  return (
    <Panel>
      <SectionHeading kicker="Competición" title="Cómo subir los rankings" intro={RANKINGS_INTRO} />
      <motion.div variants={listStagger} initial="hidden" animate="show" className="space-y-4">
        {RANKING_SCORING_ORDER.map((boardId) => {
          const guide = RANKING_SCORING_GUIDES[boardId];
          return (
            <motion.div key={boardId} variants={itemFade} className="rounded-2xl border border-slate-700/70 bg-slate-950/50 p-4">
              <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-lg font-black text-cyan-100" style={HEADING_FONT}>
                  {guide.title}
                </h3>
                <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-cyan-400/70">{guide.cadence}</span>
              </div>
              <p className="text-[14px] leading-6 text-slate-300">{guide.summary}</p>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {guide.rules.map((rule) => (
                  <li
                    key={rule.action}
                    className="flex items-center justify-between gap-3 rounded-lg border border-slate-700/60 bg-black/30 px-3 py-2"
                  >
                    <span className="text-[13.5px] leading-5 text-slate-200">{rule.action}</span>
                    <span className="shrink-0 rounded-md border border-cyan-500/40 bg-cyan-500/10 px-2 py-0.5 text-[13px] font-black text-cyan-200">
                      {rule.points}
                    </span>
                  </li>
                ))}
              </ul>
              {guide.resetNote ? <p className="mt-3 text-[13px] leading-5 text-slate-400">{guide.resetNote}</p> : null}
              {guide.weekly ? (
                <p className="mt-1 text-[13px] font-semibold text-amber-300/80">
                  Reparte premios de Nexus al top 5 cada semana; consulta los importes actuales con el botón “?” del ranking.
                </p>
              ) : null}
            </motion.div>
          );
        })}
      </motion.div>
    </Panel>
  );
}

function FactionCard({ faction }: { faction: IStoryFaction }) {
  return (
    <motion.li variants={itemFade} className="rounded-xl border border-slate-700/70 bg-slate-950/50 p-4">
      <div className="flex items-center gap-2">
        <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${faction.dot} shadow-[0_0_10px_currentColor]`} />
        <h4 className={`text-base font-black ${faction.accent}`} style={HEADING_FONT}>
          {faction.name}
        </h4>
      </div>
      <p className={`mb-2 mt-1 text-[11px] font-bold uppercase tracking-[0.16em] ${faction.accent} opacity-80`}>
        {faction.tagline}
      </p>
      <p className="text-[13.5px] leading-6 text-slate-300" style={NARRATIVE_FONT}>
        {faction.description}
      </p>
    </motion.li>
  );
}

/** Bloque narrativo destacado (amenaza / héroe) con acento de color. */
function StoryHighlight({
  kicker,
  name,
  paragraphs,
  tone,
}: {
  kicker: string;
  name: string;
  paragraphs: string[];
  tone: "danger" | "hero";
}) {
  const styles =
    tone === "danger"
      ? {
          box: "border-red-500/40 bg-red-950/20 shadow-[0_0_28px_rgba(239,68,68,0.08)]",
          dot: "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.85)] animate-pulse",
          kicker: "text-red-400",
          title: "text-white",
        }
      : {
          box: "border-cyan-400/40 bg-cyan-950/20 shadow-[0_0_28px_rgba(34,211,238,0.1)]",
          dot: "bg-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.85)]",
          kicker: "text-cyan-300",
          title: "text-white drop-shadow-[0_0_20px_rgba(6,182,212,0.6)]",
        };
  return (
    <div className={`rounded-2xl border p-5 ${styles.box}`}>
      <div className="mb-2 flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${styles.dot}`} />
        <span className={`text-[11px] font-black uppercase tracking-[0.22em] ${styles.kicker}`}>{kicker}</span>
      </div>
      <h3 className={`text-2xl font-black sm:text-3xl ${styles.title}`} style={HEADING_FONT}>
        {name}
      </h3>
      <div className="mt-3 space-y-3">
        {paragraphs.map((paragraph) => (
          <p key={paragraph} className="text-[14.5px] leading-7 text-slate-200" style={NARRATIVE_FONT}>
            {paragraph}
          </p>
        ))}
      </div>
    </div>
  );
}

function StorySection() {
  return (
    <Panel>
      <SectionHeading kicker="La trama" title="El conflicto por la red" />

      <div className="mb-4 inline-flex items-center rounded-full border border-cyan-300/40 bg-cyan-400/10 px-3 py-1">
        <span className="text-sm font-black tracking-[0.3em] text-cyan-200" style={HEADING_FONT}>
          {STORY_LORE_INTRO.year}
        </span>
      </div>
      <div className="space-y-3">
        {STORY_LORE_INTRO.paragraphs.map((paragraph) => (
          <p key={paragraph} className="max-w-3xl text-[15px] leading-7 text-slate-300" style={NARRATIVE_FONT}>
            {paragraph}
          </p>
        ))}
      </div>

      <h3 className="mb-3 mt-7 text-sm font-black uppercase tracking-[0.18em] text-cyan-300">Las tres facciones</h3>
      <motion.ul variants={listStagger} initial="hidden" animate="show" className="grid gap-3 sm:grid-cols-3">
        {STORY_FACTIONS.map((faction) => (
          <FactionCard key={faction.name} faction={faction} />
        ))}
      </motion.ul>

      <div className="mt-7 space-y-4">
        <StoryHighlight kicker={STORY_THREAT.kicker} name={STORY_THREAT.name} paragraphs={STORY_THREAT.paragraphs} tone="danger" />
        <StoryHighlight kicker={STORY_HERO.kicker} name={STORY_HERO.name} paragraphs={STORY_HERO.paragraphs} tone="hero" />
      </div>

      <div className="mt-7 border-t border-cyan-400/15 pt-6">
        <h3 className="mb-3 text-sm font-black uppercase tracking-[0.18em] text-cyan-300">Cómo funciona el Modo Historia</h3>
        <div className="space-y-3">
          {STORY_OVERVIEW.map((paragraph) => (
            <p key={paragraph} className="max-w-3xl text-[15px] leading-7 text-slate-300" style={NARRATIVE_FONT}>
              {paragraph}
            </p>
          ))}
        </div>
      </div>
    </Panel>
  );
}

function OpponentsSection() {
  const opponents = useMemo(
    () =>
      OPPONENT_ORDER.map((id) => {
        const profile = STORY_OPPONENT_NARRATION_CATALOG[id];
        const bio = OPPONENT_BIOS[id];
        if (!profile || !bio) return null;
        return {
          id,
          bio,
          portrait: `/assets/story/opponents/${profile.assetFolder}/${profile.portraits.intro}`,
          introLine: profile.lines.intro.text,
        };
      }).filter((entry): entry is NonNullable<typeof entry> => entry !== null),
    [],
  );
  return (
    <Panel>
      <SectionHeading
        kicker="Roster"
        title="Oponentes"
        intro={["Los rivales de la Historia y la Arena, con su papel y una pincelada de quiénes son."]}
      />
      <motion.div variants={listStagger} initial="hidden" animate="show" className="grid gap-3 sm:grid-cols-2">
        {opponents.map((opponent) => (
          <motion.article key={opponent.id} variants={itemFade} className="flex gap-4 rounded-2xl border border-slate-700/70 bg-slate-950/50 p-4">
            <div className="relative h-28 w-24 shrink-0 overflow-hidden rounded-xl border border-cyan-400/25 bg-[#02101c]">
              <Image src={opponent.portrait} alt={opponent.bio.displayName} fill className="object-contain object-bottom" sizes="96px" />
            </div>
            <div className="min-w-0">
              <h3 className="text-lg font-black text-white" style={HEADING_FONT}>
                {opponent.bio.displayName}
              </h3>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-cyan-300/80">{opponent.bio.role}</p>
              <p className="mt-2 text-[13.5px] leading-6 text-slate-300">{opponent.bio.bio}</p>
              <p className="mt-2.5 border-l-2 border-cyan-400/40 pl-2.5 text-[13px] italic text-cyan-100/70">“{opponent.introLine}”</p>
            </div>
          </motion.article>
        ))}
      </motion.div>
    </Panel>
  );
}

/** Diálogo de detalle de un efecto/pasiva con su carta real de ejemplo. */
function EffectDetailDialog({ item, onClose }: { item: IEffectCatalogItem; onClose: () => void }) {
  const isPassive = item.category === "PASSIVE";
  // Para pasivas sin carta innata (genéricas) mostramos una carta genérica de ejemplo.
  const innate = resolveExampleCard(item.key);
  const card = innate ?? (isPassive ? GENERIC_ENTITY_EXAMPLE : undefined);
  const isGenericPassive = isPassive && !innate;
  // Magnitud real si el efecto de la carta de ejemplo lleva un valor numérico (daño, curación…).
  const effectValue = card?.effect && "value" in card.effect ? (card.effect.value as number | undefined) : undefined;
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-cyan-400/40 bg-[#04121d]/95 p-6 shadow-[0_0_40px_rgba(34,211,238,0.15)]"
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg border border-slate-600/70 text-slate-300 transition-colors hover:border-cyan-400/60 hover:text-cyan-100"
        >
          ✕
        </button>
        <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
          {card ? (
            <div className="mx-auto shrink-0 sm:mx-0">
              <ScaledCard card={card} scale={0.9} />
            </div>
          ) : null}
          <div className="min-w-0">
            <h3 className="text-xl font-black text-cyan-100" style={HEADING_FONT}>
              {item.name}
            </h3>
            <p className="mt-2 text-[14px] leading-7 text-slate-200">{item.description}</p>
            {isGenericPassive ? (
              <p className="mt-4 text-[13px] leading-6 text-slate-400">
                Pasiva de maestría genérica: cualquier carta puede obtenerla al evolucionar (no es innata de una carta concreta).
              </p>
            ) : card ? (
              <p className="mt-4 text-[12px] font-bold uppercase tracking-widest text-cyan-400/70">Carta de ejemplo · {card.name}</p>
            ) : (
              <p className="mt-4 text-[13px] text-slate-400">Efecto de sistema sin carta única de ejemplo.</p>
            )}
          </div>
        </div>
        <EffectVfxDemo effectKey={item.key} amount={effectValue} />
      </motion.div>
    </motion.div>
  );
}

export function AcademyGlossary() {
  const [active, setActive] = useState<SectionId>("types");
  const [selected, setSelected] = useState<IEffectCatalogItem | null>(null);

  const examples = useMemo<Partial<Record<CardType, ICard>>>(() => {
    const byType = (type: CardType) => CARD_CATALOG.find((card) => card.type === type);
    return { ENTITY: byType("ENTITY"), EXECUTION: byType("EXECUTION"), TRAP: byType("TRAP"), FUSION: byType("FUSION") };
  }, []);

  const section = useMemo(() => {
    switch (active) {
      case "types":
        return <TypesSection examples={examples} />;
      case "effects":
        return <EffectsSection onSelect={setSelected} />;
      case "levels":
        return <LevelsSection />;
      case "versions":
        return <VersionsSection />;
      case "mastery":
        return <MasterySection onSelect={setSelected} />;
      case "skilltree":
        return <SkillTreeSection />;
      case "rankings":
        return <RankingsSection />;
      case "story":
        return <StorySection />;
      case "opponents":
        return <OpponentsSection />;
    }
  }, [active, examples]);

  return (
    <section className="home-modern-scroll relative flex h-full flex-col gap-4 overflow-y-auto text-slate-100 lg:grid lg:min-h-0 lg:grid-rows-[auto_minmax(0,1fr)_auto] lg:overflow-hidden">
      <header className="px-1 pt-1 text-center lg:pt-3">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-cyan-300/45 bg-cyan-400/10 px-3 py-1">
          <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.85)]" />
          <span className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-100">CÓDEX · GUÍA DEL JUEGO</span>
        </div>
        <h1 className="text-3xl font-black text-white sm:text-5xl" style={HEADING_FONT}>
          Documentación
        </h1>
      </header>

      <nav className="row-start-2 flex flex-col gap-4 lg:min-h-0 lg:flex-row">
        <div className="home-modern-scroll sticky top-0 z-20 flex gap-2 overflow-x-auto bg-[#04121d]/85 py-1 backdrop-blur-sm lg:static lg:z-auto lg:w-56 lg:shrink-0 lg:flex-col lg:overflow-visible lg:bg-transparent lg:py-0 lg:backdrop-blur-none">
          {SECTIONS.map((item) => {
            const isActive = item.id === active;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActive(item.id)}
                className={`shrink-0 whitespace-nowrap rounded-xl border px-4 py-2.5 text-left text-[13px] font-bold transition-colors lg:whitespace-normal ${
                  isActive
                    ? "border-cyan-300/70 bg-cyan-400/15 text-cyan-100 shadow-[0_0_14px_rgba(34,211,238,0.2)]"
                    : "border-slate-700/70 bg-slate-950/40 text-slate-400 hover:border-cyan-400/40 hover:text-cyan-100"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        <div className="home-modern-scroll flex-1 lg:min-h-0 lg:overflow-y-auto lg:pr-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              {section}
            </motion.div>
          </AnimatePresence>
        </div>
      </nav>

      <footer className="row-start-3 flex justify-center pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <AcademyBackButton label="Volver a Academy" href={ACADEMY_HOME_ROUTE} className="w-full max-w-xs lg:w-auto" />
      </footer>

      <AnimatePresence>
        {selected ? <EffectDetailDialog key={selected.key} item={selected} onClose={() => setSelected(null)} /> : null}
      </AnimatePresence>
    </section>
  );
}
