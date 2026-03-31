// src/components/hub/academy/training/TrainingModeCard.tsx
"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export interface ITrainingModeCardProps {
  title: string;
  description: string;
  href: string;
  actionLabel: string;
  toneBorder: string;
  toneBg: string;
  toneGlow: string;
}

export function TrainingModeCard({
  title,
  description,
  href,
  actionLabel,
  toneBorder,
  toneBg,
  toneGlow,
}: ITrainingModeCardProps) {
  return (
    <Link href={href} className="group relative block w-full outline-none" aria-label={actionLabel}>
      {/* Resplandor Neon de Fondo (Aparece en Hover) */}
      <motion.div
        className={`absolute -inset-[2px] rounded-2xl opacity-0 blur-xl transition-opacity duration-300 group-hover:opacity-100 group-focus:opacity-100 ${toneGlow}`}
        initial={false}
      />

      {/* Tarjeta Principal */}
      <motion.article
        whileHover={{ y: -6, scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className={`relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border p-6 backdrop-blur-md transition-colors ${toneBorder} ${toneBg}`}
      >
        {/* Decoración Cyberpunk (Scanlines/Grid) */}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:20px_20px] opacity-20 mask-image-[radial-gradient(ellipse_at_center,black_40%,transparent_80%)]" />

        <div className="relative z-10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-black uppercase tracking-widest text-slate-100">
              {title}
            </h2>
            {/* Pequeño acento visual */}
            <div className={`h-2 w-2 shadow-[0_0_8px_currentColor] ${toneGlow.replace('bg-', 'text-')} bg-current`} />
          </div>
          <p className="text-sm font-medium leading-relaxed text-slate-300">
            {description}
          </p>
        </div>

        <div className="relative z-10 mt-8 flex items-center justify-between border-t border-slate-700/50 pt-4">
          <span className="text-xs font-bold uppercase tracking-widest text-slate-400 transition-colors group-hover:text-slate-100">
            {actionLabel}
          </span>
          <svg
            className="h-5 w-5 -translate-x-2 text-slate-400 opacity-0 transition-all group-hover:translate-x-0 group-hover:text-slate-100 group-hover:opacity-100"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </div>
      </motion.article>
    </Link>
  );
}