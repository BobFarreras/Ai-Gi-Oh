// src/components/hub/HubUserSection.tsx - Nodo flotante del hub que muestra el jugador activo.
interface HubUserSectionProps {
  playerLabel: string;
}

export function HubUserSection({ playerLabel }: HubUserSectionProps) {
  return (
    <section className="relative w-[260px] border border-cyan-400/45 bg-[#040f1e]/85 px-4 py-3 shadow-[0_0_30px_rgba(6,182,212,0.22)]">
      <div className="absolute -right-6 top-1/2 h-10 w-10 -translate-y-1/2 rounded-full border border-cyan-300/40 bg-cyan-300/10" />
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-200/85">Usuario Activo</p>
      <p className="mt-1 text-base font-semibold text-cyan-50">{playerLabel}</p>
    </section>
  );
}
