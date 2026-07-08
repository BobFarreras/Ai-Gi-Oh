// src/components/ui/BackButton.tsx - Botón de retorno reutilizable con navegación y efecto sonoro lazy.
"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useCallback } from "react";
import { playAudio } from "@/lib/audio-pool";

interface BackButtonProps {
  /** Ruta opcional a la que navegar. Si no se provee, hará router.back() */
  href?: string;
  /** Acción opcional a ejecutar al hacer clic */
  onClick?: () => void;
  /** Texto del botón (por defecto "Volver") */
  label?: string;
  /** Clases adicionales para sobreescribir estilos */
  className?: string;
}

export function BackButton({ href, onClick, label = "Volver", className = "" }: BackButtonProps) {
  const router = useRouter();

  const handleAction = useCallback((e: React.MouseEvent) => {
    playAudio("/audio/landing/button-click.m4a", 0.2);
    // Si venimos del overworld (mochila/mercado), volvemos al mapa en vez de al hub.
    if (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("from") === "overworld") {
      e.preventDefault();
      router.push("/hub/story/overworld");
      return;
    }
    if (onClick) {
      e.preventDefault();
      onClick();
      return;
    }
    if (!href) {
      e.preventDefault();
      router.back();
    }
  }, [href, onClick, router]);

  const buttonContent = (
    <motion.div
      whileHover={{ x: -4, scale: 1.02 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={`relative group flex items-center gap-2 px-4 py-2 rounded-lg border border-cyan-800/60 bg-[#041120]/60 backdrop-blur-md shadow-[inset_0_0_10px_rgba(0,0,0,0.5)] cursor-pointer overflow-hidden transition-all duration-300 hover:border-cyan-400/80 hover:bg-cyan-950/40 hover:shadow-[0_0_15px_rgba(34,211,238,0.3)] ${className}`}
    >
      {/* Efecto de escaneo holográfico al hacer hover */}
      <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-cyan-400/10 to-transparent -translate-x-full group-hover:animate-[shine_1s_infinite] pointer-events-none" />
      
      <ChevronLeft size={18} className="text-cyan-500 group-hover:text-cyan-300 transition-colors" />
      
      <span className="text-xs font-black uppercase tracking-widest text-cyan-500/80 group-hover:text-cyan-100 transition-colors">
        {label}
      </span>
    </motion.div>
  );

  if (href) {
    return (
      <Link href={href} passHref onClick={handleAction}>
        {buttonContent}
      </Link>
    );
  }

  return (
    <button type="button" onClick={handleAction} aria-label="Volver atrás">
      {buttonContent}
    </button>
  );
}