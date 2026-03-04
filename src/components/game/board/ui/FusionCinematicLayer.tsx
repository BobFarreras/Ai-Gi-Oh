// src/components/game/board/ui/FusionCinematicLayer.tsx - Reproduce cinemática de fusión con transición de vídeo y animación de invocación.
"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ICombatLogEvent } from "@/core/entities/ICombatLog";

interface FusionCinematicLayerProps {
  events: ICombatLogEvent[];
  onActiveChange: (active: boolean) => void;
}

interface IFusionPlaybackItem {
  id: string;
  fusionCardId: string;
}

const FUSION_VIDEO_BY_CARD_ID: Record<string, string> = {
  "fusion-gemgpt": "/assets/videos/gemgpt.mp4",
  "fusion-kaclauli": "/assets/videos/kaclouli.mp4",
  "fusion-pytgress": "/assets/videos/pytgress.mp4",
};

const FUSION_RENDER_BY_CARD_ID: Record<string, string> = {
  "fusion-gemgpt": "/assets/renders/gemgpt.png",
  "fusion-kaclauli": "/assets/renders/kaclauli.png",
  "fusion-pytgress": "/assets/renders/pytgress.png",
};

const VIDEO_FALLBACK_DURATION_MS = 12000;
const SUMMON_SHOW_DURATION_MS = 1150;
const FUSION_VIDEO_VOLUME = 1;

function resolveTargetOffset(fusionCardId: string): { x: number; y: number; scale: number } {
  const target = document.querySelector(`[data-board-card-id="${fusionCardId}"]`) as HTMLElement | null;
  if (!target) return { x: 0, y: 220, scale: 0.34 };
  const rect = target.getBoundingClientRect();
  const centerX = window.innerWidth / 2;
  const centerY = window.innerHeight / 2;
  return { x: rect.left + rect.width / 2 - centerX, y: rect.top + rect.height / 2 - centerY, scale: 0.28 };
}

function toFusionItem(event: ICombatLogEvent): IFusionPlaybackItem | null {
  if (event.eventType !== "FUSION_SUMMONED" || typeof event.payload !== "object" || event.payload === null) return null;
  const payload = event.payload as Record<string, unknown>;
  const fusionCardId = typeof payload.fusionCardId === "string" ? payload.fusionCardId : null;
  if (!fusionCardId) return null;
  return { id: event.id, fusionCardId };
}

function FusionPlaybackItem({ item, onDone }: { item: IFusionPlaybackItem; onDone: () => void }) {
  const videoSrc = FUSION_VIDEO_BY_CARD_ID[item.fusionCardId] ?? null;
  const renderSrc = FUSION_RENDER_BY_CARD_ID[item.fusionCardId] ?? null;
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [phase, setPhase] = useState<"video" | "summon">(() => (videoSrc ? "video" : "summon"));
  const targetOffset = phase === "summon" ? resolveTargetOffset(item.fusionCardId) : { x: 0, y: 220, scale: 0.34 };

  useEffect(() => {
    if (phase !== "video") return;
    const timeoutId = setTimeout(() => setPhase("summon"), VIDEO_FALLBACK_DURATION_MS);
    return () => clearTimeout(timeoutId);
  }, [phase]);

  useEffect(() => {
    if (phase !== "summon") return;
    const timeoutId = setTimeout(onDone, SUMMON_SHOW_DURATION_MS);
    return () => clearTimeout(timeoutId);
  }, [onDone, phase]);

  useEffect(() => {
    if (phase !== "video" || !videoRef.current) return;
    videoRef.current.volume = FUSION_VIDEO_VOLUME;
    videoRef.current.muted = false;
    void videoRef.current.play().catch(() => undefined);
  }, [phase]);

  return (
    <motion.div
      key={item.id}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 bg-black/70 backdrop-blur-[2px] flex items-center justify-center"
    >
      {phase === "video" && videoSrc ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.82, filter: "blur(8px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="relative w-[min(74vw,1020px)] p-3 rounded-3xl border border-cyan-300/60 bg-gradient-to-br from-cyan-400/20 via-zinc-950/90 to-cyan-500/20 shadow-[0_0_55px_rgba(6,182,212,0.45)]"
        >
          <motion.div
            className="absolute inset-0 rounded-3xl pointer-events-none"
            animate={{ opacity: [0.35, 0.8, 0.35] }}
            transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
            style={{ boxShadow: "0 0 55px rgba(34,211,238,0.45) inset" }}
          />
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="relative w-full rounded-2xl border border-cyan-200/70 shadow-[0_0_35px_rgba(34,211,238,0.35)]"
            onEnded={() => setPhase("summon")}
            onError={() => setPhase("summon")}
          >
            <source src={videoSrc} type="video/mp4" />
          </video>
        </motion.div>
      ) : null}
      {phase === "summon" ? (
        <motion.div initial={{ opacity: 0, scale: 0.18, x: 0, y: 0 }} animate={{ opacity: [0, 1, 1], scale: [0.18, 1.15, targetOffset.scale], x: [0, 0, targetOffset.x], y: [0, 0, targetOffset.y] }} transition={{ duration: 1.05, times: [0, 0.36, 1], ease: "easeInOut" }} className="absolute">
          <div className="relative w-[230px] h-[320px] rounded-2xl border border-cyan-300/70 shadow-[0_0_70px_rgba(34,211,238,0.8)] overflow-hidden bg-cyan-950/30">
            {renderSrc ? <Image src={renderSrc} alt="Carta de fusión invocada" fill sizes="230px" className="object-cover" /> : null}
          </div>
        </motion.div>
      ) : null}
    </motion.div>
  );
}

export function FusionCinematicLayer({ events, onActiveChange }: FusionCinematicLayerProps) {
  const [queue, setQueue] = useState<IFusionPlaybackItem[]>([]);
  const processedCountRef = useRef(0);
  const activeItem = queue[0] ?? null;

  useEffect(() => {
    const nextItems = events.slice(processedCountRef.current).map(toFusionItem).filter((item): item is IFusionPlaybackItem => Boolean(item));
    processedCountRef.current = events.length;
    if (nextItems.length > 0) setQueue((previous) => [...previous, ...nextItems]);
  }, [events]);

  useEffect(() => {
    onActiveChange(Boolean(activeItem));
  }, [activeItem, onActiveChange]);

  if (!activeItem) return null;

  return (
    <div className="absolute inset-0 z-[250] pointer-events-none">
      <AnimatePresence mode="wait">
        <FusionPlaybackItem item={activeItem} onDone={() => setQueue((previous) => previous.slice(1))} />
      </AnimatePresence>
    </div>
  );
}
