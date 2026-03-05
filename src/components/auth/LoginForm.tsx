// src/components/auth/LoginForm.tsx - Formulario cliente para autenticación por email con feedback de error y carga.
"use client";

import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAction } from "@/services/auth/auth-actions";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    setErrorMessage(null);
    startTransition(async () => {
      const result = await signInWithEmailAction({ email, password });
      if (!result.ok) {
        setErrorMessage(result.message ?? "No se pudo iniciar sesión.");
        return;
      }
      router.push("/hub");
      router.refresh();
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-md rounded-2xl border border-cyan-900/45 bg-[#031020]/85 p-6 shadow-[0_20px_40px_rgba(0,0,0,0.45)]"
    >
      <h1 className="text-2xl font-black uppercase tracking-wider text-cyan-100">Acceso Nexus</h1>
      <p className="mt-2 text-sm text-cyan-300/80">Inicia sesión para entrar al hub del Arquitecto.</p>

      <label className="mt-5 block text-xs font-black uppercase tracking-wider text-cyan-300/85">
        Email
        <input
          aria-label="Email de acceso"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          autoComplete="email"
          className="mt-1 w-full border border-cyan-800/55 bg-[#020a14]/90 px-3 py-2 text-sm text-cyan-50 outline-none focus:border-cyan-400"
        />
      </label>

      <label className="mt-4 block text-xs font-black uppercase tracking-wider text-cyan-300/85">
        Contraseña
        <input
          aria-label="Contraseña de acceso"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          autoComplete="current-password"
          className="mt-1 w-full border border-cyan-800/55 bg-[#020a14]/90 px-3 py-2 text-sm text-cyan-50 outline-none focus:border-cyan-400"
        />
      </label>

      {errorMessage && (
        <p className="mt-4 border border-rose-500/55 bg-rose-950/35 px-3 py-2 text-xs font-bold text-rose-200">
          {errorMessage}
        </p>
      )}

      <button
        type="submit"
        aria-label="Iniciar sesión"
        disabled={isPending}
        className="mt-5 w-full border border-cyan-300/45 bg-cyan-500/15 py-2 text-xs font-black uppercase tracking-wider text-cyan-100 transition hover:bg-cyan-500/25 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Conectando..." : "Entrar al Hub"}
      </button>
    </form>
  );
}
