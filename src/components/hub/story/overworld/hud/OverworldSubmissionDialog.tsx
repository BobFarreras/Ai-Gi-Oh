// src/components/hub/story/overworld/hud/OverworldSubmissionDialog.tsx - Terminal de código (SUBMISSION) del overworld Story.
"use client";

import { useState, type FormEvent } from "react";
import { Terminal } from "lucide-react";
import { IStoryNodeSubmissionPrompt } from "@/services/story/story-node-submission-rules";

interface IOverworldSubmissionDialogProps {
  prompt: IStoryNodeSubmissionPrompt;
  /** Nodos que el jugador ya ha visitado: decide qué fragmentos de clave se le recuerdan. */
  collectedNodeIds: ReadonlySet<string>;
  /** Mensaje de error de la última validación fallida (o null). */
  errorText: string | null;
  /** Envía el código introducido para validarlo en el padre. */
  onSubmit: (code: string) => void;
  onClose: () => void;
}

/**
 * Diálogo modal de terminal: pide un código y lo envía al padre, que valida con las reglas de
 * submission existentes (`assertStoryNodeSubmissionValid`). Reutilizable por cualquier acto.
 */
export function OverworldSubmissionDialog({
  prompt,
  collectedNodeIds,
  errorText,
  onSubmit,
  onClose,
}: IOverworldSubmissionDialogProps) {
  const [code, setCode] = useState("");
  // Solo los fragmentos que el jugador ya ha recogido: los que le faltan siguen siendo un hueco.
  const knownFragments = prompt.keyFragments.filter((entry) => collectedNodeIds.has(entry.nodeId));

  const handleSubmit = (event: FormEvent): void => {
    event.preventDefault();
    onSubmit(code);
  };

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl border border-rose-300/30 bg-slate-950/95 p-5 text-rose-50 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center gap-2 text-rose-300">
          <Terminal size={16} />
          <p className="text-[11px] font-black uppercase tracking-widest">{prompt.title}</p>
        </div>
        <p className="mt-3 text-sm text-slate-200">{prompt.hint}</p>

        {prompt.keyFragments.length > 0 ? (
          <div className="mt-4 rounded-lg border border-cyan-300/25 bg-cyan-950/25 p-3">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-cyan-300">
              Fragmentos recuperados
            </p>
            <ul className="mt-2 space-y-1">
              {prompt.keyFragments.map((entry) => {
                const isKnown = collectedNodeIds.has(entry.nodeId);
                return (
                  <li key={entry.nodeId} className="flex items-baseline justify-between gap-3 text-xs">
                    <span className={isKnown ? "text-slate-300" : "text-slate-500"}>{entry.label}</span>
                    <span
                      className={
                        isKnown
                          ? "font-mono font-black tracking-widest text-cyan-100"
                          : "font-mono tracking-widest text-slate-600"
                      }
                    >
                      {isKnown ? entry.fragment : "· · · ·"}
                    </span>
                  </li>
                );
              })}
            </ul>
            {knownFragments.length === prompt.keyFragments.length ? (
              <button
                type="button"
                onClick={() => setCode(knownFragments.map((entry) => entry.fragment).join(""))}
                className="mt-3 w-full rounded border border-cyan-300/40 bg-cyan-500/15 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-cyan-100 transition hover:bg-cyan-400/25"
              >
                Encadenar fragmentos
              </button>
            ) : null}
          </div>
        ) : null}

        <input
          autoFocus
          value={code}
          onChange={(event) => setCode(event.target.value)}
          placeholder={prompt.placeholder}
          className="mt-4 w-full rounded-lg border border-rose-300/30 bg-slate-900/80 px-3 py-2 font-mono text-sm uppercase tracking-widest text-rose-100 outline-none placeholder:text-slate-500 focus:border-rose-300/70"
          aria-label="Código del terminal"
        />

        {errorText ? (
          <p className="mt-2 text-xs font-semibold text-amber-300">{errorText}</p>
        ) : null}

        <div className="mt-4 flex gap-2">
          <button
            type="submit"
            className="flex-1 rounded-lg border border-rose-300/50 bg-rose-500/20 py-2 text-xs font-black uppercase tracking-widest text-rose-100 transition hover:bg-rose-400/30"
          >
            {prompt.activationLabel}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-400/30 px-4 py-2 text-xs font-bold uppercase tracking-widest text-slate-300 transition hover:bg-white/5"
          >
            Cerrar
          </button>
        </div>
      </form>
    </div>
  );
}
