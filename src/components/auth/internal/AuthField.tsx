// src/components/auth/internal/AuthField.tsx - Campo reutilizable para inputs de autenticación con estilo terminal del proyecto.
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
  return (
    <label className="block">
      <span className="mb-2.5 block font-mono text-xs font-black uppercase tracking-[0.25em] text-cyan-400">{label}</span>
      <div className="relative group">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono text-cyan-500/60 group-focus-within:text-cyan-400">{">"}</span>
        <input
          aria-label={ariaLabel}
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          required
          autoComplete={autoComplete}
          className="w-full border border-cyan-900/60 bg-[#010308]/95 py-3.5 pl-10 pr-4 font-mono text-sm text-cyan-50 outline-none transition-all placeholder:text-cyan-700/70 focus:border-cyan-400 focus:bg-black focus:shadow-[0_0_25px_rgba(6,182,212,0.2)]"
          placeholder={placeholder}
        />
      </div>
    </label>
  );
}
