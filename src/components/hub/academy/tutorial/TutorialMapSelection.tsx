// src/components/hub/academy/tutorial/TutorialMapSelection.tsx
import Image from "next/image";
import Link from "next/link";
import { ITutorialMapNodeRuntime } from "@/core/entities/tutorial/ITutorialMapNode";
import { ACADEMY_HOME_ROUTE } from "@/core/constants/routes/academy-routes";
import { TutorialCircuitMap } from "./TutorialCircuitMap";

interface ITutorialMapSelectionProps {
  nodes: ITutorialMapNodeRuntime[];
}

export function TutorialMapSelection({ nodes }: ITutorialMapSelectionProps) {
  return (
    // Max-w ajustado y altura contenida para forzar una sola pantalla si es posible
    <section className="relative mx-auto flex w-full max-w-5xl flex-col rounded-3xl border border-cyan-900/50 bg-[#020813]/90 shadow-[0_0_60px_rgba(2,16,30,0.9)] backdrop-blur-xl">
      
      {/* Fondo de Cascada de Datos (Atmosférico, sin afectar el layout) */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-3xl opacity-20 [perspective:800px]">
        <div className="absolute inset-0 bg-[linear-gradient(transparent_0%,rgba(34,211,238,0.1)_50%,transparent_100%)] bg-[length:100%_4px] animate-[scan_4s_linear_infinite]" />
        <div className="absolute -left-32 -top-32 h-[400px] w-[400px] rounded-full bg-cyan-600/20 blur-[100px]" />
      </div>

      <div className="relative z-10 flex flex-1 flex-col p-5 sm:p-8">
        
        {/* Header Compacto (Horizontal para ahorrar espacio vertical) */}
        <header className="mb-6 flex items-center gap-5 rounded-2xl border border-cyan-500/20 bg-cyan-950/30 p-4 backdrop-blur-md">
          <div className="relative h-16 w-16 shrink-0 md:h-20 md:w-20">
            <div className="absolute -inset-1 animate-pulse rounded-lg bg-cyan-500/20 blur-sm" />
            <Image 
              src="/assets/story/opponents/opp-ch1-biglog/tutorial-BigLog.png" 
              alt="Avatar BigLog" 
              fill
              className="relative rounded-lg border border-cyan-400/50 object-cover" 
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400">
                UPLINK // BIGLOG
              </p>
            </div>
            <h1 className="text-2xl font-black uppercase tracking-tight text-white md:text-3xl">
              Ruta de Aprenentatge
            </h1>
            <p className="mt-1 max-w-xl text-xs font-medium text-slate-300 md:text-sm">
              Sistema de cuadrícula 2x2. Selecciona un nodo activo para asimilar el protocolo.
            </p>
          </div>
        </header>

        {/* Matriz 2x2 de Tutoriales */}
        <div className="flex-1">
          <TutorialCircuitMap nodes={nodes} />
        </div>

        {/* Footer Minimalista */}
        <footer className="mt-6 flex justify-end border-t border-slate-800/60 pt-4">
          <Link
            href={ACADEMY_HOME_ROUTE}
            className="group relative flex items-center gap-2 overflow-hidden rounded-md border border-slate-700 bg-[#040b15] px-6 py-2 transition-all hover:border-cyan-500 hover:shadow-[0_0_15px_rgba(34,211,238,0.2)]"
          >
            <span className="relative z-10 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-300 transition-colors group-hover:text-cyan-100">
              [ Abortar ]
            </span>
          </Link>
        </footer>
      </div>
    </section>
  );
}