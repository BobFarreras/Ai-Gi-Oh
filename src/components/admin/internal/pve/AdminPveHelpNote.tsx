// src/components/admin/internal/pve/AdminPveHelpNote.tsx - Nota explicativa plegable: qué hace cada sección antes de tocar nada.
"use client";

import { ReactNode } from "react";

interface IAdminPveHelpNoteProps {
  title: string;
  steps: string[];
  children?: ReactNode;
  defaultOpen?: boolean;
}

/**
 * Las reglas PvE no se adivinan mirando los campos. Esta nota vive junto al formulario para no obligar a
 * abrir la documentación en otra pestaña, y se pliega en cuanto el administrador ya las tiene claras.
 */
export function AdminPveHelpNote({ title, steps, children, defaultOpen = true }: IAdminPveHelpNoteProps) {
  return (
    <details open={defaultOpen} className="group rounded-xl border border-cyan-800/40 bg-[linear-gradient(120deg,rgba(6,24,44,0.7),rgba(2,10,22,0.85))]">
      <summary className="flex cursor-pointer list-none items-center gap-2 p-3">
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-cyan-500/60 text-[10px] font-black text-cyan-300">?</span>
        <span className="flex-1 text-[11px] font-black uppercase tracking-wider text-cyan-200">{title}</span>
        <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 fill-none stroke-cyan-400 transition-transform group-open:rotate-180">
          <path d="M6 9l6 6 6-6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </summary>
      <div className="space-y-2 px-3 pb-3">
        <ol className="space-y-1.5">
          {steps.map((step, index) => (
            <li key={step} className="flex gap-2 text-[11px] leading-relaxed text-slate-300">
              <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded bg-cyan-950/80 text-[9px] font-black text-cyan-300">
                {index + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
        {children}
      </div>
    </details>
  );
}
