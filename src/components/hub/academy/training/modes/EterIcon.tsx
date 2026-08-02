// src/components/hub/academy/training/modes/EterIcon.tsx - Icono de la moneda Éter, compartido por Supervivencia y Olimpo.
"use client";
import Image from "next/image";

export const ETER_ICON_SRC = "/assets/renders/eter.webp";

/**
 * Una sola fuente para el icono: si mañana cambia el arte de la moneda, cambia aquí y en ningún sitio
 * más. Es decorativo — el importe siempre va acompañado de texto accesible.
 */
export function EterIcon({ size = 14, className = "" }: { size?: number; className?: string }) {
  return (
    <Image
      src={ETER_ICON_SRC}
      alt=""
      aria-hidden
      width={size}
      height={size}
      unoptimized
      className={`inline-block shrink-0 select-none ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
