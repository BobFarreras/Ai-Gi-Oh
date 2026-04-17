// src/components/tfm/internal/TFMTechnicalEvidencePanel.tsx - Panel resumido de arquitectura, Engram, seguridad y calidad.
"use client";

import { motion } from "framer-motion";
import { TFM_TECHNICAL_EVIDENCE_BLOCKS } from "@/components/tfm/internal/tfm-technical-evidence";

/**
 * Expone los pilares técnicos clave con animaciones laterales y texto de alta legibilidad.
 */
export function TFMTechnicalEvidencePanel() {
  const canObserve = typeof window !== "undefined" && "IntersectionObserver" in window;

  return (
    <section id="fundamentos-tecnicos" aria-label="Fundamentos técnicos del proyecto" className="rounded-2xl border border-cyan-500/45 bg-black/65 p-6 sm:p-8">
      <p className="font-mono text-sm uppercase tracking-[0.2em] text-cyan-300">Fundamentos Técnicos</p>
      <h2 className="mt-2 text-3xl font-black text-cyan-50 sm:text-4xl">Cómo se construyó el proyecto</h2>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {TFM_TECHNICAL_EVIDENCE_BLOCKS.map((block, index) => (
          <motion.article
            id={block.id}
            key={block.id}
            initial={canObserve ? { opacity: 0, x: index % 2 === 0 ? -64 : 64 } : false}
            whileInView={canObserve ? { opacity: 1, x: 0 } : undefined}
            animate={!canObserve ? { opacity: 1, x: 0 } : undefined}
            viewport={canObserve ? { once: true, amount: 0.25 } : undefined}
            transition={{ duration: 0.55, ease: "easeOut", delay: index * 0.05 }}
            className="rounded-xl border border-cyan-400/35 bg-cyan-950/20 p-5"
          >
            <h3 className="text-2xl font-black text-cyan-50">{block.title}</h3>
            <p className="mt-2 text-lg text-cyan-100/90">{block.summary}</p>
            <ul className="mt-4 space-y-2 text-base text-cyan-50/95">
              {block.bullets.map((bullet) => (
                <li key={bullet} className="flex gap-2">
                  <span aria-hidden className="mt-[9px] h-2 w-2 rounded-full bg-cyan-400" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
