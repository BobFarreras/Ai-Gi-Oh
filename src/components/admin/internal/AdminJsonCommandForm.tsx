// src/components/admin/internal/AdminJsonCommandForm.tsx - Formulario JSON reutilizable para comandos administrativos de escritura.
"use client";

import { FormEvent, useState } from "react";

interface AdminJsonCommandFormProps {
  title: string;
  description: string;
  initialValue: string;
  submitLabel: string;
  onSubmitJson: (json: unknown) => Promise<void>;
}

export function AdminJsonCommandForm({ title, description, initialValue, submitLabel, onSubmitJson }: AdminJsonCommandFormProps) {
  const [value, setValue] = useState<string>(initialValue);
  const [feedback, setFeedback] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setFeedback("");
    setIsSubmitting(true);
    try {
      const parsed = JSON.parse(value) as unknown;
      await onSubmitJson(parsed);
      setFeedback("Guardado correctamente.");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "No se pudo procesar el comando.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-slate-700 bg-slate-900/80 p-4">
      <h3 className="text-sm font-bold uppercase tracking-wide text-cyan-200">{title}</h3>
      <p className="mt-1 text-xs text-slate-300">{description}</p>
      <label className="mt-3 block text-xs font-semibold uppercase tracking-wide text-slate-200" htmlFor={`json-${title}`}>
        Comando JSON
      </label>
      <textarea
        id={`json-${title}`}
        aria-label={`Comando ${title}`}
        className="mt-2 h-52 w-full rounded-md border border-slate-600 bg-slate-950 p-3 font-mono text-xs text-slate-100"
        value={value}
        onChange={(event) => setValue(event.target.value)}
      />
      <button
        type="submit"
        aria-label={submitLabel}
        disabled={isSubmitting}
        className="mt-3 rounded-md bg-cyan-500 px-3 py-2 text-xs font-bold uppercase tracking-wide text-slate-950 disabled:opacity-60"
      >
        {isSubmitting ? "Guardando..." : submitLabel}
      </button>
      {feedback ? <p className="mt-2 text-xs text-cyan-200">{feedback}</p> : null}
    </form>
  );
}
