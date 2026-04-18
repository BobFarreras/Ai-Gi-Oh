// src/components/tfm/internal/TFMTechStackPanel.tsx - Panel visual del stack tecnológico del proyecto con logos y tooling.
"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { TFM_STACK_LOGOS, TFM_STACK_TOOLING } from "@/components/tfm/internal/tfm-tech-stack";

/**
 * Muestra stack real con iconografía y utilidades clave del desarrollo.
 */
export function TFMTechStackPanel() {
  const canObserve = typeof window !== "undefined" && "IntersectionObserver" in window;

  return (
    <section id="stack-tecnologico" aria-label="Stack tecnológico utilizado" className="rounded-2xl border border-cyan-400/45 bg-black/65 p-6 sm:p-8">
      <p className="font-mono text-sm uppercase tracking-[0.2em] text-cyan-300">Stack Tecnológico</p>
      <h2 className="mt-2 text-3xl font-black text-cyan-50 sm:text-4xl">Tecnologías usadas en AI-GI-OH</h2>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {TFM_STACK_LOGOS.map((logo, index) => (
          <motion.article
            key={logo.id}
            initial={canObserve ? { opacity: 0, x: index % 2 === 0 ? -56 : 56 } : false}
            whileInView={canObserve ? { opacity: 1, x: 0 } : undefined}
            animate={!canObserve ? { opacity: 1, x: 0 } : undefined}
            viewport={canObserve ? { once: true, amount: 0.3 } : undefined}
            transition={{ duration: 0.45, delay: index * 0.05 }}
            className="rounded-xl border border-cyan-500/35 bg-cyan-950/20 p-4"
          >
            <div className="flex items-center gap-3">
              <Image
                src={logo.imagePath}
                alt={logo.name}
                width={56}
                height={56}
                className={`h-14 w-14 rounded-md object-contain bg-black/30 p-1 ${logo.id === "docker" ? "scale-90" : ""}`}
              />
              <p className="text-lg font-bold text-cyan-50">{logo.name}</p>
            </div>
          </motion.article>
        ))}
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        {TFM_STACK_TOOLING.map((tool) => (
          <span key={tool} className="rounded-md border border-cyan-400/35 bg-black/55 px-3 py-2 text-sm font-semibold text-cyan-100">
            {tool}
          </span>
        ))}
      </div>
    </section>
  );
}
