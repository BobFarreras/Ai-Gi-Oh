// src/components/hub/guided-tour/internal/HubStorySimulationOverlay.tsx - Simulación visual del circuito Story antes del combate tutorial.
import Image from "next/image";
import { motion } from "framer-motion";

interface IHubStorySimulationOverlayProps {
  isOpen: boolean;
  onStartCombat: () => void;
  onClose: () => void;
}

/**
 * Muestra una versión simplificada del circuito de Story con dos plataformas:
 * la del jugador y la del nodo de combate contra BigLog.
 */
export function HubStorySimulationOverlay({ isOpen, onStartCombat, onClose }: IHubStorySimulationOverlayProps) {
  if (!isOpen) return null;

  return (
    <section className="fixed inset-0 z-[220] flex flex-col items-center justify-center bg-slate-950/88 p-4 backdrop-blur-md">
      <header className="mb-6 text-center">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300">Archivo de Historia</p>
        <h2 className="mt-1 text-2xl font-black uppercase text-white sm:text-3xl">Simulación de acceso</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-300">
          Este es el flujo de Story. Avanza por las plataformas hasta encontrar el nodo de combate.
        </p>
      </header>

      <div className="relative flex w-full max-w-2xl items-center justify-center gap-4 sm:gap-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col items-center gap-2 rounded-2xl border border-cyan-400/40 bg-[#041120]/90 p-4 shadow-[0_0_30px_rgba(34,211,238,0.25)]"
        >
          <div className="relative h-16 w-16 overflow-hidden rounded-xl border border-cyan-300/40 bg-slate-950 sm:h-20 sm:w-20">
            <Image src="/assets/story/player/avatar-Jugador.webp" alt="Tu posición" fill sizes="80px" className="object-contain p-1" unoptimized />
          </div>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-cyan-100">Tú</p>
        </motion.div>

        <div className="flex-1">
          <div className="h-1 w-full bg-gradient-to-r from-cyan-500/60 via-cyan-300 to-rose-500/60" />
          <div className="mt-1 text-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Ruta de acceso</div>
        </div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 }}
          className="flex flex-col items-center gap-2 rounded-2xl border border-rose-400/50 bg-[#1a0508]/90 p-4 shadow-[0_0_30px_rgba(244,63,94,0.25)]"
        >
          <div className="relative h-16 w-16 overflow-hidden rounded-xl border border-rose-300/40 bg-slate-950 sm:h-20 sm:w-20">
            <Image src="/assets/story/opponents/opp-ch1-biglog/avatar-BigLog.webp" alt="BigLog" fill sizes="80px" className="object-contain p-1" unoptimized />
          </div>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-rose-100">Nodo combate</p>
        </motion.div>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={onStartCombat}
          className="rounded-md border border-cyan-400/60 bg-cyan-950/80 px-5 py-2.5 text-xs font-black uppercase tracking-[0.14em] text-cyan-100 transition-colors hover:bg-cyan-900/80"
        >
          Iniciar combate tutorial
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md border border-slate-600 bg-slate-950/70 px-5 py-2.5 text-xs font-black uppercase tracking-[0.14em] text-slate-200 transition-colors hover:bg-slate-900/80"
        >
          Volver al Hub
        </button>
      </div>
    </section>
  );
}
