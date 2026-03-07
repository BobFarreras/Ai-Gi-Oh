// src/components/hub/sections/HubSectionLoading.tsx - Loader visual reutilizable para pantallas de sección del Hub durante fetch server.
import { CyberBackground } from "@/components/landing/CyberBackground";

interface HubSectionLoadingProps {
  label: string;
}

export function HubSectionLoading({ label }: HubSectionLoadingProps) {
  return (
    <main className="hub-control-room-bg relative flex min-h-dvh items-center justify-center overflow-hidden px-4 text-slate-100">
      <CyberBackground />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(14,165,233,0.16),transparent_56%)]" />
      <section className="relative w-full max-w-md rounded-2xl border border-cyan-700/45 bg-[#041120]/85 p-5 shadow-[0_0_32px_rgba(8,145,178,0.22)]">
        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-cyan-300/90">Cargando módulo</p>
        <h1 className="mt-2 text-xl font-black uppercase tracking-wider text-cyan-100">{label}</h1>
        <div className="mt-4 h-2 overflow-hidden rounded-full border border-cyan-500/45 bg-[#020a14]">
          <div className="h-full w-2/5 animate-pulse bg-[linear-gradient(90deg,#22d3ee,#38bdf8,#0ea5e9)]" />
        </div>
      </section>
    </main>
  );
}
