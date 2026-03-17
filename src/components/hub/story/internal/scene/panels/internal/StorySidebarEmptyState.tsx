// src/components/hub/story/internal/scene/panels/internal/StorySidebarEmptyState.tsx - Estado vacío del panel Story cuando no hay nodo seleccionado.
import { motion } from "framer-motion";

interface IStorySidebarEmptyStateProps {
  isCompactMode: boolean;
}

export function StorySidebarEmptyState({ isCompactMode }: IStorySidebarEmptyStateProps) {
  return (
    <motion.div
      key="empty"
      initial={{ opacity: 0, filter: "blur(4px)" }}
      animate={{ opacity: 1, filter: "blur(0px)" }}
      transition={{ duration: 0.3 }}
      className="flex flex-1 items-center justify-center text-center"
    >
      <div className={isCompactMode ? "relative border border-cyan-500/30 bg-black/40 px-4 py-4 shadow-inner [clip-path:polygon(0_10px,10px_0,100%_0,100%_calc(100%-10px),calc(100%-10px)_100%,0_100%)]" : "relative border border-cyan-500/30 bg-black/40 px-6 py-6 shadow-inner [clip-path:polygon(0_12px,12px_0,100%_0,100%_calc(100%-12px),calc(100%-12px)_100%,0_100%)]"}>
        <div className={isCompactMode ? "mb-2 opacity-60" : "mb-3 opacity-60"}>
          <svg className={isCompactMode ? "mx-auto h-6 w-6 animate-pulse text-cyan-400" : "mx-auto h-8 w-8 animate-pulse text-cyan-400"} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className={isCompactMode ? "text-[10px] font-black uppercase tracking-[0.15em] text-cyan-200" : "text-[11px] font-black uppercase tracking-[0.2em] text-cyan-200"}>
          Esperando selección
          <br />
          de coordenadas tácticas...
        </p>
      </div>
    </motion.div>
  );
}
