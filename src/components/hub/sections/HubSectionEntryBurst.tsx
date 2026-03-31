// src/components/hub/sections/HubSectionEntryBurst.tsx - Efecto de entrada visual del Hub sin dependencia runtime de librerías de animación.
"use client";

export function HubSectionEntryBurst() {
  return (
    <div className="pointer-events-none fixed inset-0 z-[210] overflow-hidden">
      <div aria-hidden className="hub-entry-burst absolute left-1/2 top-1/2 h-44 w-44 rounded-full border border-cyan-300/45 bg-[radial-gradient(circle,rgba(56,189,248,0.86)_0%,rgba(2,16,30,0.8)_40%,rgba(1,4,10,0.98)_100%)] shadow-[0_0_56px_rgba(34,211,238,0.6)]" />
      <style jsx>{`
        .hub-entry-burst {
          transform: translate(-50%, -50%) scale(0.12);
          opacity: 0.95;
          animation: hub-entry-burst 0.62s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        @keyframes hub-entry-burst {
          from {
            transform: translate(-50%, -50%) scale(0.12);
            opacity: 0.95;
          }
          to {
            transform: translate(-50%, -50%) scale(20);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
