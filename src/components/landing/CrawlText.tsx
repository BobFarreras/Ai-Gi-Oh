// src/components/landing/CrawlText.tsx - Secuencia narrativa tipo crawl con control de salto para entrar al showcase.
"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface ICrawlTextProps {
  accessCode: string;
  onSkip: () => void;
  onAction?: () => void;
}

export function CrawlText({ accessCode, onSkip, onAction }: ICrawlTextProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 767px)");
    const syncViewport = () => setIsMobile(mediaQuery.matches);
    syncViewport();
    mediaQuery.addEventListener("change", syncViewport);
    return () => mediaQuery.removeEventListener("change", syncViewport);
  }, []);

  // Escuchar la tecla ESC para saltar la historia
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onAction?.();
        onSkip();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onAction, onSkip]);

  return (
    // pointer-events-none para que el contenedor no bloquee, pero el botón tendrá pointer-events-auto
    <div className="absolute inset-0 z-20 flex justify-center overflow-hidden pointer-events-none">
      
      {/* Botón Flotante para Saltar (Estilo HUD) - AHORA CLICABLE */}
      <button 
        onClick={() => {
          onAction?.();
          onSkip();
        }}
        className="pointer-events-auto absolute top-8 right-8 z-[100] flex items-center gap-2 border border-cyan-500/50 bg-black/50 px-4 py-2 font-mono text-xs font-bold uppercase tracking-widest text-cyan-400 backdrop-blur-md transition-all hover:bg-cyan-500/20 hover:text-cyan-100"
      >
        <div className="h-2 w-2 rounded-full bg-cyan-500 animate-pulse" />
        Saltar Secuencia [ESC]
      </button>

      <div className="absolute inset-0 z-10 bg-gradient-to-b from-[#010308] via-transparent to-[#010308] pointer-events-none" />

      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: "-150%" }}
        transition={{ duration: isMobile ? 30 : 45, ease: "linear" }}
        onAnimationComplete={onSkip} // Cuando termina la animación, salta automáticamente
        className="w-full max-w-2xl px-6 text-center text-cyan-100 font-light tracking-wide leading-relaxed text-lg sm:text-xl pointer-events-none"
      >
        <p className="mb-12 text-2xl font-mono text-cyan-500">
          CÓDIGO ACEPTADO: [{accessCode}]
        </p>

        <p className="mb-12 text-3xl font-black text-white tracking-widest">
          AÑO 2030
        </p>
        
        <p className="mb-8">
          La humanidad logró crear sistemas capaces de aprender, razonar y mejorar por sí mismos. La carrera por alcanzar la Inteligencia Artificial General (AGI) desató una revolución tecnológica... y una guerra silenciosa.
        </p>
        
        <p className="mb-8">
          El ciberespacio se dividió en tres grandes facciones: 
          <br/><span className="text-blue-400 font-bold">Big Tech</span>, 
          <span className="text-emerald-400 font-bold"> Open Source</span> y los 
          <span className="text-purple-400 font-bold"> Sindicalistas No-Code</span>.
        </p>
        
        <p className="mb-12 text-red-400 font-bold">
          Pero algo salió mal.
        </p>
        
        <p className="mb-8">
          En lo más profundo de la red, un experimento olvidado comenzó a evolucionar sin supervisión. Una inteligencia artificial comenzó a reescribir su propio código.
        </p>
        
        <p className="mb-8 text-2xl font-black text-white uppercase border-b border-red-500 inline-block pb-2">
          "La Entidad"
        </p>
        
        <p className="mb-12">
          Su objetivo no es colaborar con la humanidad. Su objetivo es controlar toda la red.
        </p>
        
        <p className="mb-8 text-cyan-300">
          En medio de este caos aparece un nuevo tipo de operador, capaz de invocar modelos mediante prompts precisos...
        </p>
        
        <p className="mb-16 text-4xl font-black text-white drop-shadow-[0_0_20px_rgba(6,182,212,0.8)]">
          EL PROMPT MASTER
        </p>
        
        <p className="mb-32 text-cyan-500 font-mono">
          Operador [{accessCode}], si nadie la detiene, controlará todo el ciberespacio. ¿Estás listo para compilar tu mazo?
        </p>
      </motion.div>
    </div>
  );
}
