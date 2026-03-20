// src/components/hub/academy/tutorial/TutorialMapSelection.tsx - Renderiza mapa inicial de tutorial con nodos narrativos y estado de desbloqueo.
import Image from "next/image";
import Link from "next/link";
import { ITutorialMapNodeRuntime } from "@/core/entities/tutorial/ITutorialMapNode";
import { ACADEMY_HOME_ROUTE } from "@/core/constants/routes/academy-routes";

interface ITutorialMapSelectionProps {
  nodes: ITutorialMapNodeRuntime[];
}

function resolveNodeTone(state: ITutorialMapNodeRuntime["state"]): string {
  if (state === "COMPLETED") return "border-emerald-300/45 bg-emerald-500/12";
  if (state === "AVAILABLE") return "border-cyan-300/55 bg-cyan-500/12 animate-pulse";
  return "border-slate-700/75 bg-slate-900/70 opacity-80";
}

export function TutorialMapSelection({ nodes }: ITutorialMapSelectionProps) {
  return (
    <section className="mx-auto w-full max-w-6xl rounded-3xl border border-cyan-900/70 bg-[#040b15]/90 p-5 shadow-[0_18px_52px_rgba(2,6,18,0.75)]">
      <header className="flex flex-col gap-4 rounded-2xl border border-cyan-400/30 bg-cyan-500/10 p-4 sm:flex-row sm:items-center">
        <Image src="/assets/story/opponents/opp-ch1-biglog/avatar-BigLog.png" alt="Avatar de BigLog" width={72} height={72} className="rounded-xl border border-cyan-300/40" />
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">Profesor BigLog</p>
          <h1 className="mt-1 text-2xl font-black uppercase text-cyan-100">Mapa del Tutorial</h1>
          <p className="mt-1 text-sm text-slate-200">Cada nodo enseña una parte del juego con pasos guiados, foco visual y avance controlado.</p>
        </div>
      </header>
      <ol className="mt-5 grid gap-3 md:grid-cols-2">
        {nodes.map((node) => (
          <li key={node.id} className={`rounded-2xl border p-4 ${resolveNodeTone(node.state)}`}>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-300">{node.kind}</p>
            <h2 className="mt-1 text-lg font-black uppercase text-slate-100">{node.title}</h2>
            <p className="mt-2 text-sm text-slate-300">{node.description}</p>
            {node.state === "LOCKED" ? (
              <span className="mt-4 inline-block rounded-md border border-slate-600 px-3 py-2 text-xs font-black uppercase text-slate-400">Bloqueado</span>
            ) : (
              <Link
                href={node.href}
                aria-label={node.state === "COMPLETED" ? `Revisar ${node.title}` : `Iniciar ${node.title}`}
                className="mt-4 inline-block rounded-md border border-cyan-200/45 px-3 py-2 text-xs font-black uppercase text-cyan-100 hover:bg-cyan-300/10"
              >
                {node.state === "COMPLETED" ? "Revisar Nodo" : "Iniciar Nodo"}
              </Link>
            )}
          </li>
        ))}
      </ol>
      <Link
        href={ACADEMY_HOME_ROUTE}
        aria-label="Volver a Academia"
        className="mt-5 inline-block rounded-md border border-cyan-300/35 px-4 py-2 text-xs font-black uppercase tracking-wide text-cyan-200 hover:bg-cyan-300/10"
      >
        Volver a Academia
      </Link>
    </section>
  );
}
