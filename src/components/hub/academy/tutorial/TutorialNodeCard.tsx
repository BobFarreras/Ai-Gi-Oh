// src/components/hub/academy/tutorial/TutorialNodeCard.tsx
"use client";

import Link from "next/link";
import { motion, Transition } from "framer-motion";
import { ITutorialMapNodeRuntime } from "@/core/entities/tutorial/ITutorialMapNode";

interface ITutorialNodeCardProps {
  node: ITutorialMapNodeRuntime;
}

// Físicas de resorte para interacciones "snappy"
const snappySpring: Transition = { type: "spring", stiffness: 400, damping: 25 };

export function TutorialNodeCard({ node }: ITutorialNodeCardProps) {
  const isCompleted = node.state === "COMPLETED";
  const isAvailable = node.state === "AVAILABLE";
  const isLocked = node.state === "LOCKED";

  // Estilos condicionales basados en el estado del nodo
  const borderTone = isCompleted ? "border-emerald-500/50" : isAvailable ? "border-cyan-400/80 shadow-[0_0_20px_rgba(34,211,238,0.25)]" : "border-slate-800/80";
  const bgTone = isCompleted ? "bg-emerald-950/20" : isAvailable ? "bg-[#061428]/80" : "bg-slate-900/30 grayscale opacity-50";
  const textTone = isCompleted ? "text-emerald-100" : isAvailable ? "text-cyan-100" : "text-slate-500";
  const glowDot = isCompleted ? "bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.8)]" : isAvailable ? "bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)] animate-pulse" : "bg-slate-700";

  return (
    <motion.article
      whileHover={isLocked ? {} : { scale: 1.03, y: -4 }}
      whileTap={isLocked ? {} : { scale: 0.97 }}
      transition={snappySpring}
      className={`relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border p-5 backdrop-blur-xl transition-colors duration-300 ${borderTone} ${bgTone}`}
    >
      {/* Scanlines internos sutiles */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:100%_4px] opacity-30" />

      <div>
        <header className="flex items-center justify-between">
          <p className={`text-[10px] font-black uppercase tracking-[0.25em] ${isCompleted ? 'text-emerald-400' : 'text-cyan-500'}`}>
            SYS.{node.kind}
          </p>
          {/* LED de Estado del Circuito */}
          <div className={`h-2.5 w-2.5 rounded-full ${glowDot}`} />
        </header>

        <h2 className={`mt-2 text-lg font-black uppercase tracking-wide md:text-xl ${textTone}`}>
          {node.title}
        </h2>
        <p className="mt-2 text-xs font-medium leading-relaxed text-slate-300 md:text-sm">
          {node.description}
        </p>
      </div>

      <footer className="mt-4 border-t border-slate-700/50 pt-3">
        {isLocked ? (
          <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            Acceso Bloqueado
          </span>
        ) : (
          <Link
            href={node.href}
            className={`group flex w-full items-center justify-between rounded-md bg-white/5 px-3 py-2 text-xs font-bold uppercase tracking-widest transition-colors hover:bg-white/10 ${isCompleted ? "text-emerald-300" : "text-cyan-300"}`}
          >
            <span>{isCompleted ? "Revisar Datos" : "Iniciar Infiltración"}</span>
            <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
          </Link>
        )}
      </footer>
    </motion.article>
  );
}