// src/components/hub/guided-tour/internal/HubStorySimulationOverlay.tsx - Simulación del circuito Story con nodos visuales auténticos antes del combate tutorial.
"use client";

import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

interface IHubStorySimulationOverlayProps {
  isOpen: boolean;
  onStartCombat: () => void;
  onClose: () => void;
}

/** Nodo tipo Story: plataforma oval + token flotante con imagen, igual que StoryMapNode. */
function StoryCircuitNode({
  imageSrc,
  imageAlt,
  label,
  isBoss = false,
  isClickable = false,
  isSelected = false,
  entryDelay = 0,
  onClick,
}: {
  imageSrc: string;
  imageAlt: string;
  label: string;
  isBoss?: boolean;
  isClickable?: boolean;
  isSelected?: boolean;
  entryDelay?: number;
  onClick?: () => void;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const active = isSelected || isHovered;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 200, damping: 24, delay: entryDelay }}
      className="relative flex flex-col items-center"
    >
      {/* Token flotante */}
      <motion.div
        animate={{ y: active ? -18 : [0, -9, 0] }}
        transition={active ? { type: "spring", stiffness: 220, damping: 20 } : { repeat: Infinity, duration: 3.2, ease: "easeInOut" }}
        className="relative z-20 mb-[-16px]"
        style={{ filter: active ? "drop-shadow(0 0 22px rgba(6,182,212,0.95))" : undefined }}
      >
        <button
          type="button"
          disabled={!isClickable}
          onClick={onClick}
          onMouseEnter={() => isClickable && setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="relative flex h-[72px] w-[72px] items-center justify-center outline-none sm:h-20 sm:w-20"
          style={{ cursor: isClickable ? "pointer" : "default" }}
        >
          <div
            className={`relative flex h-full w-full items-center justify-center overflow-hidden border-2 bg-[#090c14] transition-colors duration-300 ${
              isBoss
                ? "rotate-45 rounded-lg border-fuchsia-500"
                : active
                  ? "rounded-full border-cyan-400"
                  : "rounded-full border-cyan-700"
            }`}
          >
            <div className={isBoss ? "-rotate-45 h-full w-full relative" : "relative h-full w-full"}>
              <Image
                src={imageSrc}
                alt={imageAlt}
                fill
                sizes="80px"
                className="object-cover"
                unoptimized
              />
            </div>
          </div>
          {isClickable && active ? (
            <span className="absolute -bottom-7 z-30 whitespace-nowrap rounded-md border border-cyan-500/50 bg-black/90 px-3 py-1 text-[10px] font-black tracking-widest text-cyan-300 shadow-xl backdrop-blur-md">
              {label}
            </span>
          ) : null}
        </button>
      </motion.div>

      {/* Plataforma oval */}
      <div
        className={`relative z-10 h-10 w-20 rounded-[50%] border-4 shadow-[0_10px_20px_rgba(0,0,0,0.8)] transition-colors duration-300 sm:h-12 sm:w-24 ${
          active && isClickable
            ? "border-cyan-400 bg-cyan-900 shadow-[0_0_30px_rgba(6,182,212,0.6)]"
            : "border-slate-700 bg-slate-900"
        }`}
      >
        <div
          className={`absolute inset-2 rounded-[50%] border-2 blur-[1px] transition-colors ${
            active && isClickable ? "animate-pulse border-cyan-300" : "border-slate-800"
          }`}
        />
      </div>

      {/* Etiqueta fija (sin pulsación del hover) */}
      {!isClickable ? (
        <span className="mt-2 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-300">
          {label}
        </span>
      ) : null}
    </motion.div>
  );
}

/** Segmento de circuito entre nodos, estilo Story. */
function CircuitConnector() {
  return (
    <motion.div
      initial={{ scaleX: 0, opacity: 0 }}
      animate={{ scaleX: 1, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.35 }}
      className="mx-3 flex flex-col items-center sm:mx-5"
      style={{ originX: 0 }}
    >
      <div className="h-1 w-20 bg-gradient-to-r from-emerald-500/70 via-cyan-400 to-fuchsia-500/70 shadow-[0_0_8px_rgba(34,211,238,0.6)] sm:w-28" />
      <p className="mt-1 text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">
        Circuito
      </p>
    </motion.div>
  );
}

/**
 * Simula el circuito de Story con dos nodos reales: el jugador en su posición actual
 * y el nodo de combate de BigLog. El jugador hace click en el nodo boss para entrar al tutorial.
 */
export function HubStorySimulationOverlay({ isOpen, onStartCombat, onClose }: IHubStorySimulationOverlayProps) {
  const [isCombatSelected, setIsCombatSelected] = useState(false);

  function handleCombatClick() {
    setIsCombatSelected(true);
    window.setTimeout(onStartCombat, 380);
  }

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.section
          key="story-sim"
          aria-label="Simulación del circuito de Historia"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          className="fixed inset-0 z-[220] overflow-hidden"
        >
          {/* Fondo Story auténtico */}
          <div className="absolute inset-0 bg-[#050810]" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(14,165,233,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(14,165,233,0.04)_1px,transparent_1px)] bg-[size:40px_40px]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_40%,rgba(6,182,212,0.10),transparent_65%)]" />

          {/* Contenido central */}
          <div className="relative z-10 flex h-full flex-col items-center justify-center px-4">
            {/* Header */}
            <motion.header
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-10 text-center"
            >
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-cyan-400">
                Archivo de Historia — Acto I
              </p>
              <h2 className="mt-1 text-xl font-black uppercase text-white sm:text-2xl">
                Nodo de Combate
              </h2>
              <p className="mx-auto mt-2 max-w-xs text-xs leading-relaxed text-slate-400 sm:max-w-sm sm:text-sm">
                Selecciona el nodo de BigLog para iniciar el tutorial de combate.
              </p>
            </motion.header>

            {/* Circuito: jugador → BigLog */}
            <div className="flex items-center">
              <StoryCircuitNode
                imageSrc="/assets/story/player/avatar-Jugador.webp"
                imageAlt="Tu posición"
                label="Tú"
                entryDelay={0.2}
              />

              <CircuitConnector />

              <StoryCircuitNode
                imageSrc="/assets/story/opponents/opp-ch1-biglog/avatar-BigLog.webp"
                imageAlt="BigLog"
                label="Iniciar combate"
                isBoss
                isClickable
                isSelected={isCombatSelected}
                entryDelay={0.3}
                onClick={handleCombatClick}
              />
            </div>

            {/* Hint */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-10 text-[10px] font-black uppercase tracking-[0.22em] text-slate-500"
            >
              Haz click en el nodo de BigLog para entrar
            </motion.p>

            {/* Botón volver */}
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              type="button"
              onClick={onClose}
              className="mt-4 rounded-md border border-slate-700/60 bg-slate-950/70 px-4 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400 transition-colors hover:bg-slate-900"
            >
              Volver al Hub
            </motion.button>
          </div>
        </motion.section>
      ) : null}
    </AnimatePresence>
  );
}
