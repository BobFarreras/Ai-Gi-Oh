// src/components/hub/academy/training/modes/olympus/internal/OlympusChampionDeckDialog.tsx - Muestra el mazo prestado con el nivel real con el que saldrá.
"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { ICard } from "@/core/entities/ICard";
import { HomeMiniCard } from "@/components/hub/home/HomeMiniCard";
import { HomeCardInspector } from "@/components/hub/home/HomeCardInspector";
import { IOlympusChampionDeckPreview, fetchChampionDeck } from "../olympus-api-client";

interface IOlympusChampionDeckDialogProps {
  /** Móntalo con `key={championId}`: cambiar de campeón parte de cero, sin arrastrar el mazo anterior. */
  championId: string;
  onClose: () => void;
}

/**
 * El mazo lo resuelve el servidor por el mismo camino que el snapshot de combate, así que lo que se ve
 * aquí es literalmente lo que se va a jugar, con los rangos del árbol ya aplicados.
 */
export function OlympusChampionDeckDialog({ championId, onClose }: IOlympusChampionDeckDialogProps) {
  const [preview, setPreview] = useState<IOlympusChampionDeckPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<ICard | null>(null);

  useEffect(() => {
    let active = true;
    fetchChampionDeck(championId)
      .then((data) => { if (active) setPreview(data); })
      .catch((caught: unknown) => {
        if (active) setError(caught instanceof Error ? caught.message : "No se pudo cargar el mazo.");
      });
    return () => { active = false; };
  }, [championId]);

  // Escape cierra por capas: primero la ficha abierta encima, después el mazo.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (selected) setSelected(null);
      else onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, selected]);

  return (
    <div className="fixed inset-0 z-[130] flex items-end justify-center bg-[#05020a]/90 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={`Mazo prestado de ${preview?.displayName ?? "tu campeón"}`}
        // Entra desde abajo: el panel «sube» al pulsar «Ver mazo» en lugar de aparecer de golpe.
        initial={{ y: "100%", opacity: 0.4 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 320, damping: 34 }}
        className="flex h-[88dvh] w-full flex-col overflow-hidden rounded-t-2xl border border-amber-400/50 bg-[#120a1e] shadow-[0_0_40px_rgba(168,85,247,0.35)] sm:h-[82dvh] sm:max-w-4xl sm:rounded-2xl"
      >
        <header className="flex flex-wrap items-center gap-2 border-b border-violet-900/60 bg-[linear-gradient(110deg,rgba(251,191,36,0.14),transparent,rgba(168,85,247,0.16))] px-4 py-3">
          <div className="min-w-0">
            <p className="font-display text-[10px] font-black uppercase tracking-[0.3em] text-violet-300/80">Mazo prestado</p>
            <h2 className="truncate font-display text-xl font-black uppercase italic text-amber-50">
              {preview?.displayName ?? "…"}
            </h2>
          </div>
          {preview ? (
            <div className="flex flex-wrap items-center gap-2 text-[10px] font-black">
              <Chip label="Nivel" value={String(preview.level)} tone="text-emerald-300 border-emerald-500/40" />
              <Chip label="Versión" value={`V${preview.versionTier}`} tone="text-amber-300 border-amber-500/40" />
              <Chip label="LP" value={preview.startingLp.toLocaleString("es-ES")} tone="text-sky-300 border-sky-500/40" />
              {preview.energyBonus > 0 ? (
                <Chip label="Energía" value={`+${preview.energyBonus}`} tone="text-violet-300 border-violet-500/40" />
              ) : null}
            </div>
          ) : null}
          <button
            type="button"
            aria-label="Cerrar el mazo del campeón"
            onClick={onClose}
            className="ml-auto flex h-10 w-10 items-center justify-center rounded-lg border border-slate-600/60 text-slate-300 transition hover:bg-slate-800/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-300"
          >
            <X aria-hidden size={18} />
          </button>
        </header>

        {error ? (
          <p role="alert" className="p-6 text-center text-sm font-bold text-rose-300">{error}</p>
        ) : !preview ? (
          <DeckSkeleton />
        ) : (
          <div className="home-modern-scroll min-h-0 flex-1 overflow-y-auto p-3">
            <DeckZone title="Mazo principal" cards={preview.deck} accent="text-cyan-200" onSelect={setSelected} />
            {preview.fusionDeck.length > 0 ? (
              <DeckZone title="Fusión" cards={preview.fusionDeck} accent="text-violet-300" onSelect={setSelected} />
            ) : null}
            <p className="pt-1 text-center text-[10px] text-slate-500">Pulsa una carta para ver su ficha completa</p>
          </div>
        )}
      </motion.div>

      {/* La ficha va por ENCIMA del mazo y centrada, con alto propio: dentro del panel quedaba tapada. */}
      <AnimatePresence>
        {selected ? <CardDetailDialog card={selected} onClose={() => setSelected(null)} /> : null}
      </AnimatePresence>
    </div>
  );
}

function CardDetailDialog({ card, onClose }: { card: ICard; onClose: () => void }) {
  return (
    <motion.div
      className="fixed inset-0 z-[140] flex items-center justify-center bg-[#05020a]/80 p-4 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={`Ficha de ${card.name}`}
        initial={{ y: 40, scale: 0.94, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        exit={{ y: 30, scale: 0.96, opacity: 0 }}
        transition={{ type: "spring", stiffness: 340, damping: 30 }}
        onClick={(event) => event.stopPropagation()}
        // Alto explícito: el inspector se dimensiona con `h-full` y sin él se colapsaba a cero.
        className="relative h-[min(620px,86dvh)] w-[min(360px,94vw)]"
      >
        <button
          type="button"
          aria-label="Cerrar la ficha de la carta"
          onClick={onClose}
          className="absolute -top-3 right-0 z-10 flex h-9 w-9 translate-y-[-100%] items-center justify-center rounded-lg border border-slate-500/60 bg-slate-950/80 text-slate-200 transition hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-300"
        >
          <X aria-hidden size={18} />
        </button>
        <HomeCardInspector
          selectedCard={card}
          selectedCardVersionTier={card.versionTier ?? 0}
          selectedCardLevel={card.level ?? 0}
          selectedCardXp={card.xp ?? 0}
          selectedCardMasteryPassiveSkillId={card.masteryPassiveSkillId ?? null}
          minCardScale={0.6}
          maxCardScale={1}
        />
      </motion.div>
    </motion.div>
  );
}

/** Esqueleto con la forma final del mazo: la espera se lee como carga, no como pantalla rota. */
function DeckSkeleton() {
  return (
    <div className="min-h-0 flex-1 p-3" aria-busy="true" aria-label="Cargando el mazo del campeón">
      <div className="grid grid-cols-[repeat(auto-fill,minmax(66px,1fr))] justify-items-center gap-2">
        {Array.from({ length: 20 }, (_, index) => (
          <div key={index} className="w-[66px] animate-pulse rounded-md bg-violet-950/60" style={{ aspectRatio: "13 / 19" }} />
        ))}
      </div>
    </div>
  );
}

function Chip({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <span className={`rounded-full border bg-slate-950/60 px-2 py-0.5 ${tone}`} title={label}>
      <span className="mr-1 text-[9px] uppercase tracking-wider opacity-70">{label}</span>
      {value}
    </span>
  );
}

function DeckZone({ title, cards, accent, onSelect }: {
  title: string;
  cards: ICard[];
  accent: string;
  onSelect: (card: ICard) => void;
}) {
  return (
    <section className="mb-3">
      <div className="mb-2 flex items-center justify-between">
        <h3 className={`font-display text-[11px] font-black uppercase tracking-[0.2em] ${accent}`}>{title}</h3>
        <span className="rounded border border-slate-700/60 bg-slate-950/60 px-2 text-[10px] font-black text-slate-400">
          {cards.length}
        </span>
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(66px,1fr))] justify-items-center gap-2">
        {cards.map((card, index) => (
          <div key={`${card.id}-${index}`} className="w-[66px]">
            <HomeMiniCard
              card={card}
              label={`Ver la ficha de ${card.name}`}
              versionTier={card.versionTier ?? 0}
              level={card.level ?? 0}
              xp={card.xp ?? 0}
              onClick={() => onSelect(card)}
              showSlotContainer={false}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
