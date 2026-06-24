// src/components/hub/progression/internal/ProgressionDialogShell.tsx - Marco táctico común para los diálogos de progresión. Se despliega desde el dock (origen abajo-izquierda) y usa el scrollbar del juego.
"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";

const FRAME_CLIP = "polygon(0 14px,14px 0,100% 0,100% calc(100% - 14px),calc(100% - 14px) 100%,0 100%)";

interface IProgressionDialogShellProps {
  title: string;
  subtitle?: string;
  icon: ReactNode;
  accent?: "cyan" | "fuchsia";
  /** Contenido fijo bajo la cabecera (no scrollea): balance, countdown, etc. */
  headerExtra?: ReactNode;
  children: ReactNode;
  onClose: () => void;
}

export function ProgressionDialogShell({ title, subtitle, icon, accent = "cyan", headerExtra, children, onClose }: IProgressionDialogShellProps) {
  const accentText = accent === "fuchsia" ? "text-fuchsia-200" : "text-cyan-200";
  const accentBar = accent === "fuchsia" ? "bg-fuchsia-400" : "bg-cyan-400";
  const accentBorder = accent === "fuchsia" ? "border-fuchsia-500/40" : "border-cyan-500/40";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.82, y: 28 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 14 }}
        transition={{ type: "spring", stiffness: 280, damping: 26 }}
        style={{ transformOrigin: "left bottom", willChange: "transform", clipPath: FRAME_CLIP }}
        onClick={(event) => event.stopPropagation()}
        className={`flex max-h-[88vh] w-full max-w-md flex-col border ${accentBorder} bg-[#040d18]/96 shadow-[0_0_40px_rgba(0,0,0,0.6)]`}
      >
        <span className={`h-1 w-full ${accentBar}`} />
        <div className="flex items-center gap-3 px-5 pb-3 pt-4">
          <span className={`flex h-11 w-11 shrink-0 items-center justify-center border ${accentBorder} bg-[#03101c] ${accentText}`} style={{ clipPath: "polygon(7px 0,100% 0,100% calc(100% - 7px),calc(100% - 7px) 100%,0 100%,0 7px)" }}>
            {icon}
          </span>
          <div className="min-w-0 flex-1">
            <h2 className={`font-mono text-lg font-black uppercase tracking-[0.16em] ${accentText}`}>{title}</h2>
            {subtitle ? <p className="truncate font-mono text-xs uppercase tracking-[0.12em] text-slate-400">{subtitle}</p> : null}
          </div>
          <button
            type="button"
            aria-label="Cerrar"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center border border-slate-600/70 text-slate-300 transition-colors hover:border-cyan-400 hover:text-cyan-200"
            style={{ clipPath: "polygon(5px 0,100% 0,100% calc(100% - 5px),calc(100% - 5px) 100%,0 100%,0 5px)" }}
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>
        {headerExtra ? <div className="px-5 pb-3">{headerExtra}</div> : null}
        <div className="home-modern-scroll min-h-0 flex-1 overflow-y-auto px-5 pb-5">{children}</div>
      </motion.div>
    </motion.div>
  );
}
