// src/components/auth/BackToLandingButton.tsx - Botón reutilizable para volver a la landing con SFX de interacción.
"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useAuthFormSfx } from "@/components/auth/internal/useAuthFormSfx";

export function BackToLandingButton() {
  const { playButtonClick } = useAuthFormSfx();

  return (
    <Link
      href="/"
      aria-label="Volver a la landing"
      onClick={playButtonClick}
      className="fixed left-4 top-4 z-[80] flex h-11 w-11 items-center justify-center border border-cyan-500/45 bg-black/75 text-cyan-300 transition-all hover:border-cyan-300 hover:text-cyan-100 md:bottom-6 md:left-auto md:right-6 md:top-auto md:h-auto md:w-auto md:px-4 md:py-3 md:font-mono md:text-[10px] md:font-black md:uppercase md:tracking-[0.16em]"
    >
      <ArrowLeft className="h-4 w-4 md:hidden" />
      <span className="hidden md:inline">Volver</span>
    </Link>
  );
}
