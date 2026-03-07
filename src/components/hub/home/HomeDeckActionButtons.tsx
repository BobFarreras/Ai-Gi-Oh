// src/components/hub/home/HomeDeckActionButtons.tsx - Grupo de acciones principales de Arsenal (añadir, remover y evolucionar).
"use client";

import { motion } from "framer-motion";
import { Download, Sparkles, Upload } from "lucide-react";

interface HomeDeckActionButtonsProps {
  canInsert: boolean;
  canRemove: boolean;
  canEvolve: boolean;
  evolveCost: number | null;
  onInsert: () => Promise<unknown>;
  onRemove: () => Promise<unknown>;
  onEvolve: () => Promise<unknown>;
}

const buttonBaseClass =
  "relative flex shrink-0 items-center gap-2 overflow-hidden rounded-lg border px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all duration-300 backdrop-blur-md sm:px-5 sm:py-2.5 sm:text-xs";

export function HomeDeckActionButtons({
  canInsert,
  canRemove,
  canEvolve,
  evolveCost,
  onInsert,
  onRemove,
  onEvolve,
}: HomeDeckActionButtonsProps) {
  return (
    <div className="home-modern-scroll flex w-full items-center gap-2 overflow-x-auto pb-1 lg:w-auto lg:pb-0">
      <motion.button
        type="button"
        aria-label="Introducir carta seleccionada en el deck"
        disabled={!canInsert}
        onClick={() => void onInsert()}
        whileHover={canInsert ? { scale: 1.02 } : {}}
        whileTap={canInsert ? { scale: 0.95 } : {}}
        className={`${buttonBaseClass} ${canInsert ? "border-cyan-500/50 bg-cyan-950/40 text-cyan-300" : "border-zinc-800 bg-zinc-950/50 text-zinc-600"}`}
      >
        <Upload size={16} className={canInsert ? "text-cyan-400" : "text-zinc-600"} />
        <span>Añadir</span>
      </motion.button>
      <motion.button
        type="button"
        aria-label="Sacar carta seleccionada del deck"
        disabled={!canRemove}
        onClick={() => void onRemove()}
        whileHover={canRemove ? { scale: 1.02 } : {}}
        whileTap={canRemove ? { scale: 0.95 } : {}}
        className={`${buttonBaseClass} ${canRemove ? "border-red-500/50 bg-red-950/40 text-red-300" : "border-zinc-800 bg-zinc-950/50 text-zinc-600"}`}
      >
        <Download size={16} className={canRemove ? "text-red-400" : "text-zinc-600"} />
        <span>Remover</span>
      </motion.button>
      <motion.button
        type="button"
        aria-label="Evolucionar carta seleccionada"
        disabled={!canEvolve}
        onClick={() => void onEvolve()}
        whileHover={canEvolve ? { scale: 1.05 } : {}}
        whileTap={canEvolve ? { scale: 0.95 } : {}}
        className={`${buttonBaseClass} ${canEvolve ? "border-amber-400/60 bg-amber-900/35 text-amber-200" : "border-zinc-800 bg-zinc-950/50 text-zinc-600"}`}
      >
        <Sparkles size={16} className={canEvolve ? "text-amber-300" : "text-zinc-600"} />
        <span>{canEvolve && evolveCost ? `Evolucionar (${evolveCost})` : "Evolucionar"}</span>
      </motion.button>
    </div>
  );
}
