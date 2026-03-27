// src/components/hub/academy/training/TrainingMode3DPanel.tsx
"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ReactNode } from "react";

export interface ITrainingMode3DPanelProps {
  title: string;
  subtitle: string;
  description: string;
  href: string;
  actionLabel: string;
  theme: "tutorial" | "arena";
  icon: ReactNode;
}

const snappySpring = { type: "spring", stiffness: 300, damping: 20 } as const;

export function TrainingMode3DPanel({
  title,
  subtitle,
  description,
  href,
  actionLabel,
  theme,
  icon,
}: ITrainingMode3DPanelProps) {
  // Configuración de colores basada en el tema
  const isTutorial = theme === "tutorial";
  const glowColor = isTutorial ? "rgba(34,211,238,0.5)" : "rgba(16,185,129,0.5)"; // Cyan vs Emerald
  const borderColor = isTutorial ? "border-cyan-500/40" : "border-emerald-500/40";
  const bgColor = isTutorial ? "bg-cyan-950/20" : "bg-emerald-950/20";
  const hoverBorderColor = isTutorial ? "group-hover:border-cyan-400" : "group-hover:border-emerald-400";
  const textColor = isTutorial ? "text-cyan-300" : "text-emerald-300";

  return (
    <Link href={href} className="group relative block w-full outline-none" style={{ perspective: "1200px" }}>
      <motion.article
        initial={{ rotateX: 10, rotateY: isTutorial ? 5 : -5, scale: 0.95 }}
        whileHover={{ rotateX: 0, rotateY: 0, scale: 1.02, z: 20 }}
        whileTap={{ scale: 0.98, z: 0 }}
        transition={snappySpring}
        style={{ transformStyle: "preserve-3d" }}
        className={`relative flex h-[420px] flex-col overflow-hidden rounded-2xl border ${borderColor} ${bgColor} p-0 backdrop-blur-md transition-all duration-300 ${hoverBorderColor}`}
      >
        {/* Resplandor Holográfico de Fondo */}
        <div 
          className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{ background: `radial-gradient(circle at 50% 50%, ${glowColor} 0%, transparent 70%)` }}
        />

        {/* Render 3D Simulado (Imagen o Patrón) */}
        <div className="relative h-1/2 w-full overflow-hidden border-b border-slate-700/50 bg-[#020611]">
          {/* Grid de perspectiva */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:20px_20px] [transform:rotateX(60deg)_scale(2)] opacity-30 origin-bottom" />
          
          <div className="absolute inset-0 flex items-center justify-center translate-z-[50px]">
             {/* Aquí iría el render 3D de BigLog o la Arena, usamos el icono a gran escala por ahora */}
             <div className={`transform transition-transform duration-500 group-hover:scale-110 drop-shadow-[0_0_25px_${glowColor}] opacity-60`}>
                {icon}
             </div>
          </div>
        </div>

        {/* Contenido del Panel (Información) */}
        <div className="relative z-10 flex h-1/2 flex-col justify-between p-6 bg-gradient-to-t from-[#040b15] to-transparent">
          <div>
            <header className="mb-2 flex items-center justify-between">
              <span className={`text-[10px] font-bold uppercase tracking-[0.3em] ${textColor}`}>
                {subtitle}
              </span>
              <div className={`h-1.5 w-1.5 rounded-full bg-current shadow-[0_0_8px_currentColor] ${textColor}`} />
            </header>
            <h2 className="text-2xl font-black uppercase tracking-widest text-slate-100 group-hover:text-white transition-colors translate-z-[30px]">
              {title}
            </h2>
            <p className="mt-2 text-sm font-medium leading-relaxed text-slate-400 group-hover:text-slate-300 translate-z-[20px]">
              {description}
            </p>
          </div>

          {/* Botón de Acción Integrado */}
          <footer className="mt-auto w-full translate-z-[40px]">
            <div className={`flex items-center justify-between border-t border-slate-700/50 pt-4`}>
              <span className={`text-xs font-bold uppercase tracking-widest transition-colors ${textColor} group-hover:text-white`}>
                {actionLabel}
              </span>
              <svg className={`h-5 w-5 -translate-x-2 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100 ${textColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
          </footer>
        </div>
      </motion.article>
    </Link>
  );
}