// src/components/hub/internal/UserSearchInput.tsx - Input de búsqueda de usuarios con estilo cyber/espacial reutilizable entre módulos del Hub.
"use client";

import { memo } from "react";
import { Search, X } from "lucide-react";

interface UserSearchInputProps {
  /** Valor actual de la búsqueda. */
  value: string;
  /** Callback cuando cambia el valor. */
  onChange: (value: string) => void;
  /** Placeholder personalizable por módulo. */
  placeholder?: string;
  /** Label accesible. */
  ariaLabel?: string;
}

/**
 * Input de búsqueda de usuarios. Componente presentacional puro (controlled).
 * Estilo cyber coherente con el resto del Hub: borde cian, glow al focus,
 * icono de lupa y botón de limpiar. Sin animaciones infinitas (solo
 * transition al focus, GPU-friendly).
 */
function UserSearchInputComponent({
  value,
  onChange,
  placeholder = "Buscar duelista…",
  ariaLabel = "Buscar duelista por nombre",
}: UserSearchInputProps) {
  return (
    <label className="flex w-full items-center gap-2 rounded-lg border border-cyan-500/30 bg-[#020a14]/80 px-3 py-2 shadow-[inset_0_0_12px_rgba(0,0,0,0.6)] transition focus-within:border-cyan-400/70 focus-within:shadow-[0_0_14px_rgba(34,211,238,0.2)]">
      <Search size={16} className="shrink-0 text-cyan-400" />
      <input
        type="text"
        aria-label={ariaLabel}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent text-sm font-medium tracking-wider text-cyan-50 outline-none placeholder:text-cyan-100/40"
      />
      {value.length > 0 && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Limpiar búsqueda"
          className="shrink-0 rounded p-0.5 text-slate-500 transition hover:text-slate-300"
        >
          <X size={14} />
        </button>
      )}
    </label>
  );
}

export const UserSearchInput = memo(UserSearchInputComponent);
