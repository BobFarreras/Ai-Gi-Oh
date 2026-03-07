// src/components/hub/sections/HubSectionScreen.tsx - Presenta estado base de cada módulo del hub con control visual de bloqueo.
import Link from "next/link";
import { HubSectionEntryBurst } from "@/components/hub/sections/HubSectionEntryBurst";

interface HubSectionScreenProps {
  title: string;
  description: string;
  isLocked: boolean;
  lockReason: string | null;
}

export function HubSectionScreen({ title, description, isLocked, lockReason }: HubSectionScreenProps) {
  return (
    <main className="hub-control-room-bg h-full overflow-hidden px-4 py-8 text-slate-100 sm:px-6">
      <HubSectionEntryBurst />
      <section className="mx-auto w-full max-w-4xl overflow-hidden rounded-3xl border border-slate-800/90 bg-[#040b15]/90 p-6 shadow-[0_24px_46px_rgba(2,4,12,0.8)]">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-300/85">Módulo del Hub</p>
        <h1 className="mt-2 text-4xl font-black uppercase tracking-wide text-cyan-200">{title}</h1>
        <p className="mt-3 max-w-2xl text-sm text-slate-300">{description}</p>

        {isLocked ? (
          <div className="mt-6 rounded-2xl border border-amber-400/35 bg-amber-500/10 p-4">
            <p className="text-sm font-semibold text-amber-300">Sección bloqueada</p>
            <p className="mt-1 text-sm text-amber-200">{lockReason ?? "Completa los requisitos para desbloquear esta sección."}</p>
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-cyan-400/35 bg-cyan-500/10 p-4">
            <p className="text-sm font-semibold text-cyan-200">Sección disponible</p>
            <p className="mt-1 text-sm text-cyan-100">Base de módulo lista para continuar la implementación funcional.</p>
          </div>
        )}

        <Link
          href="/hub"
          aria-label="Volver a sala de control"
          className="mt-7 inline-block rounded-lg border border-cyan-300/35 px-4 py-2 text-sm font-bold uppercase tracking-wide text-cyan-200 transition hover:bg-cyan-400/10"
        >
          Volver a Sala de Control
        </Link>
      </section>
    </main>
  );
}
