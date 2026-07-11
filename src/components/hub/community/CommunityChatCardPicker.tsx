// src/components/hub/community/CommunityChatCardPicker.tsx - Selector de carta propia para compartir en el chat.
"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Search, X } from "lucide-react";
import { ICard } from "@/core/entities/ICard";
import { CardThumbnail } from "@/components/game/card/CardThumbnail";
import { getShareableCards } from "@/app/hub/chat/actions/get-shareable-cards";

interface CommunityChatCardPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (card: ICard) => void;
}

const CLIP_PANEL = "polygon(0 14px,14px 0,100% 0,100% calc(100% - 14px),calc(100% - 14px) 100%,0 100%)";

export function CommunityChatCardPicker({ isOpen, onClose, onSelect }: CommunityChatCardPickerProps) {
  const [cards, setCards] = useState<ICard[] | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    void getShareableCards().then((result) => {
      if (active) setCards(result);
    });
    return () => {
      active = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;
  const normalized = query.trim().toLowerCase();
  const filtered = (cards ?? []).filter((card) => normalized.length === 0 || card.name.toLowerCase().includes(normalized));

  return (
    <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/80 p-3 backdrop-blur-md" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 18 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 280, damping: 26 }}
        className="flex max-h-[85dvh] w-full max-w-2xl flex-col border border-cyan-500/45 bg-[#040d18] p-3 sm:p-4"
        style={{ clipPath: CLIP_PANEL }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="font-mono text-[11px] font-black uppercase tracking-[0.2em] text-cyan-300/80">Compartir una carta</p>
          <button type="button" aria-label="Cerrar" onClick={onClose} className="flex h-8 w-8 items-center justify-center border border-cyan-500/45 text-cyan-200 transition hover:text-cyan-50">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mb-3 flex items-center gap-2 border border-cyan-900/60 bg-[#020a14] px-2.5 py-2">
          <Search className="h-4 w-4 shrink-0 text-cyan-500" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Busca en tus cartas…"
            aria-label="Buscar carta"
            className="w-full bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-600"
          />
        </div>
        <div className="home-modern-scroll grid min-h-0 flex-1 grid-cols-4 content-start gap-2 overflow-y-auto sm:grid-cols-5 sm:gap-2.5">
          {cards === null ? (
            <p className="col-span-full py-8 text-center font-mono text-xs uppercase tracking-widest text-cyan-500/60">Cargando tus cartas…</p>
          ) : filtered.length === 0 ? (
            <p className="col-span-full py-8 text-center font-mono text-xs uppercase tracking-widest text-cyan-500/60">
              {cards.length === 0 ? "Aún no tienes cartas." : "Sin resultados."}
            </p>
          ) : (
            filtered.map((card) => (
              <button
                key={card.id}
                type="button"
                aria-label={`Compartir ${card.name}`}
                onClick={() => onSelect(card)}
                className="aspect-[13/19] w-full transition hover:scale-[1.04] hover:drop-shadow-[0_0_12px_rgba(34,211,238,0.5)]"
              >
                <CardThumbnail card={card} versionTier={card.versionTier ?? 0} level={card.level} xp={card.xp ?? 0} showArtSkeleton />
              </button>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
}
