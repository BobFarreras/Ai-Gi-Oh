// src/components/hub/progression/internal/FragmentIcon.tsx - Icono de cristal facetado para la moneda de evento (Fragmentos).
export function FragmentIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="fragment-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f5d0fe" />
          <stop offset="50%" stopColor="#e879f9" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
      </defs>
      <path d="M12 1.5 L20 8 L12 22.5 L4 8 Z" fill="url(#fragment-grad)" stroke="#fae8ff" strokeWidth="0.8" strokeLinejoin="round" />
      <path d="M4 8 H20 M12 1.5 L8 8 L12 22.5 M12 1.5 L16 8 L12 22.5" fill="none" stroke="#6b21a8" strokeWidth="0.7" strokeOpacity="0.55" strokeLinejoin="round" />
      <path d="M9 4.5 L11 7" fill="none" stroke="#ffffff" strokeWidth="0.8" strokeOpacity="0.7" strokeLinecap="round" />
    </svg>
  );
}
