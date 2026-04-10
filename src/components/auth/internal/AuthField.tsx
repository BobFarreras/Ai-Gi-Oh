// src/components/auth/internal/AuthField.tsx - Campo reutilizable para inputs auth con soporte opcional de visibilidad de contraseña.
"use client";

import { useMemo, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface AuthFieldProps {
  label: string;
  ariaLabel: string;
  value: string;
  type: "email" | "password";
  autoComplete: string;
  placeholder: string;
  onChange: (nextValue: string) => void;
}

export function AuthField({ label, ariaLabel, value, type, autoComplete, placeholder, onChange }: AuthFieldProps) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const shouldShowVisibilityToggle = type === "password";
  const effectiveType = useMemo(() => {
    if (!shouldShowVisibilityToggle) return type;
    return isPasswordVisible ? "text" : "password";
  }, [isPasswordVisible, shouldShowVisibilityToggle, type]);

  return (
    <label className="block">
      <span className="mb-2.5 block font-mono text-xs font-black uppercase tracking-[0.25em] text-cyan-400">{label}</span>
      <div className="relative group">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono text-cyan-500/60 group-focus-within:text-cyan-400">{">"}</span>
        <input
          aria-label={ariaLabel}
          type={effectiveType}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          required
          autoComplete={autoComplete}
          className="w-full border border-cyan-900/60 bg-[#010308]/95 py-3.5 pl-10 pr-12 font-mono text-sm text-cyan-50 outline-none transition-all placeholder:text-cyan-700/70 focus:border-cyan-400 focus:bg-black focus:shadow-[0_0_25px_rgba(6,182,212,0.2)]"
          placeholder={placeholder}
        />
        {shouldShowVisibilityToggle ? (
          <button
            type="button"
            aria-label={isPasswordVisible ? "Ocultar contraseña" : "Mostrar contraseña"}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-cyan-500/70 transition hover:text-cyan-300 focus:outline-none focus-visible:text-cyan-200"
            onClick={() => setIsPasswordVisible((current) => !current)}
          >
            {isPasswordVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        ) : null}
      </div>
    </label>
  );
}
