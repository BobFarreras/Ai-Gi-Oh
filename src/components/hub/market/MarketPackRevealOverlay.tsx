// src/components/hub/market/MarketPackRevealOverlay.tsx
"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ICard } from "@/core/entities/ICard";
import { Card } from "@/components/game/card/Card";
import { PackageOpen, Sparkles } from "lucide-react";

interface MarketPackRevealOverlayProps {
  cards: ICard[];
  isOpen: boolean;
  onClose: () => void;
}

type RevealPhase = "IDLE" | "OPENING" | "REVEALED";

export function MarketPackRevealOverlay({ cards, isOpen, onClose }: MarketPackRevealOverlayProps) {
  const [phase, setPhase] = useState<RevealPhase>("IDLE");

  // Máquina de estados perfecta sin colisiones de timers
  useEffect(() => {
    if (!isOpen) return;

    let timer: NodeJS.Timeout;

    if (phase === "IDLE") {
      timer = setTimeout(() => setPhase("OPENING"), 1500);
    } else if (phase === "OPENING") {
      timer = setTimeout(() => setPhase("REVEALED"), 600);
    }

    return () => clearTimeout(timer);
  }, [isOpen, phase]);

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setPhase("IDLE");
    }, 500);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[400] flex items-center justify-center bg-[#01050a]/95 backdrop-blur-2xl"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(192,38,211,0.15),transparent_70%)] pointer-events-none" />

          {/* FASE 1 & 2: EL SOBRE Y LA EXPLOSIÓN */}
          <AnimatePresence>
            {(phase === "IDLE" || phase === "OPENING") && (
              <motion.div
                key="pack-center"
                initial={{ scale: 0.5, opacity: 0, y: 50 }}
                animate={
                  phase === "IDLE" 
                    ? { scale: 1, opacity: 1, y: [-15, 15, -15] }
                    : { scale: 2, opacity: 0, filter: "brightness(300%) blur(10px)" }
                }
                exit={{ opacity: 0 }}
                transition={
                  phase === "IDLE" 
                    ? { y: { duration: 4, repeat: Infinity, ease: "easeInOut" }, scale: { type: "spring", damping: 20 } } 
                    : { duration: 0.5, ease: "easeIn" }
                }
                className="relative z-50 w-[220px] aspect-[3/4] rounded-2xl border-2 border-fuchsia-400 bg-[linear-gradient(145deg,rgba(134,25,143,0.9),rgba(15,23,42,0.95))] shadow-[0_0_80px_rgba(192,38,211,0.5)] flex flex-col justify-between p-6"
              >
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.2),transparent_50%)] pointer-events-none rounded-xl" />
                <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.1)_50%,transparent_75%)] animate-[shine_2s_infinite] pointer-events-none rounded-xl" />

                <div className="text-center relative z-10">
                  <div className="flex items-center justify-center gap-1.5 mb-2">
                    <Sparkles size={16} className="text-fuchsia-300 animate-pulse" />
                    <p className="text-xs font-black uppercase tracking-[0.3em] text-fuchsia-300">Nexus Pack</p>
                  </div>
                </div>

                <div className="flex-1 flex flex-col items-center justify-center relative z-10">
                  <div className="w-24 h-24 rounded-full border border-fuchsia-400/50 bg-fuchsia-500/20 flex items-center justify-center backdrop-blur-md shadow-[0_0_40px_rgba(192,38,211,0.6)]">
                    <PackageOpen size={40} className="text-fuchsia-100" />
                  </div>
                  <p className="mt-8 text-[10px] font-black uppercase tracking-[0.3em] text-white animate-pulse">
                    Extrayendo...
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* EL FLASH BLANCO */}
          <AnimatePresence>
            {phase === "OPENING" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 z-[60] bg-white mix-blend-overlay pointer-events-none"
              />
            )}
          </AnimatePresence>

          {/* FASE 3: CARTAS */}
          <AnimatePresence>
            {phase === "REVEALED" && (
              <motion.div
                key="cards-grid"
                initial="hidden"
                animate="visible"
                exit="hidden"
                variants={{
                  hidden: { opacity: 0 },
                  visible: {
                    opacity: 1,
                    transition: { staggerChildren: 0.35 },
                  },
                }}
                className="relative z-50 flex flex-col items-center justify-center w-full max-w-7xl px-4 h-full"
              >
                <motion.h2 
                  initial={{ opacity: 0, y: -20 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  transition={{ delay: 0.4 }}
                  className="mb-10 text-xl sm:text-3xl font-black uppercase tracking-[0.4em] text-cyan-300 drop-shadow-[0_0_15px_rgba(34,211,238,0.6)] text-center"
                >
                  Datos Desencriptados
                </motion.h2>

                <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 lg:gap-8 perspective-[1000px]">
                  {cards.map((card, index) => (
                    <motion.div
                      key={`${card.id}-${index}`}
                      variants={{
                        hidden: { opacity: 0, rotateY: 90, scale: 0.5, y: 50 },
                        visible: { 
                          opacity: 1, 
                          rotateY: 0, 
                          scale: 1, 
                          y: 0,
                          transition: { type: "spring", stiffness: 150, damping: 15 }
                        },
                      }}
                      whileHover={{ scale: 1.05, y: -10 }}
                      className="relative transform-style-3d cursor-pointer"
                    >
                      <div className="w-[140px] h-[180px] sm:w-[170px] sm:h-[220px] xl:w-[200px] xl:h-[260px] relative drop-shadow-[0_20px_40px_rgba(0,0,0,0.8)]">
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                           <div className="origin-center scale-[0.50] sm:scale-[0.60] xl:scale-[0.75]">
                             <Card card={card} />
                           </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: cards.length * 0.35 + 0.8 }}
                  className="mt-14"
                >
                  <button
                    type="button"
                    onClick={handleClose}
                    className="relative flex items-center gap-2 rounded-xl border border-cyan-400/60 bg-cyan-950/40 px-10 py-3 text-sm sm:text-base font-black uppercase tracking-[0.2em] text-cyan-100 shadow-[0_0_20px_rgba(34,211,238,0.2)] hover:bg-cyan-900/60 hover:border-cyan-300 hover:text-white hover:shadow-[0_0_40px_rgba(34,211,238,0.5)] transition-all group overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent -translate-x-full group-hover:animate-[shine_1s_infinite]" />
                    <span className="relative z-10">Integrar al Almacén</span>
                  </button>
                </motion.div>
                
              </motion.div>
            )}
          </AnimatePresence>

        </motion.div>
      )}
    </AnimatePresence>
  );
}