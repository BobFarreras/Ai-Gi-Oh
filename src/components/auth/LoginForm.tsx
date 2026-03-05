// src/components/auth/LoginForm.tsx
"use client";

import Link from "next/link";
import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { loginWithEmail } from "@/services/auth/auth-http-client";

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
      const result = await loginWithEmail({ email, password });
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
      className="w-full rounded-2xl border border-cyan-900/45 bg-[#031020]/85 p-6 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.6)] backdrop-blur-md"
    >
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-black uppercase tracking-widest text-cyan-100 drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]">
          Acceso Nexus
        </h1>
        <p className="mt-2 text-xs uppercase tracking-widest text-cyan-400/70">
          Inicia sesión en el hub del Arquitecto
        </p>
      </div>

      <label className="block text-[10px] font-black uppercase tracking-widest text-cyan-300/80">
        Email
        <input
          aria-label="Email de acceso"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          autoComplete="email"
          className="mt-1.5 w-full rounded-lg border border-cyan-800/50 bg-[#02060d]/90 px-3 py-2.5 text-sm text-cyan-50 shadow-[inset_0_0_10px_rgba(0,0,0,0.8)] outline-none transition-all placeholder:text-cyan-900/50 focus:border-cyan-400 focus:shadow-[0_0_15px_rgba(34,211,238,0.15)]"
          placeholder="operador@nexus.com"
        />
      </label>

      <label className="mt-5 block text-[10px] font-black uppercase tracking-widest text-cyan-300/80">
        Contraseña
        <input
          aria-label="Contraseña de acceso"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          autoComplete="current-password"
          className="mt-1.5 w-full rounded-lg border border-cyan-800/50 bg-[#02060d]/90 px-3 py-2.5 text-sm text-cyan-50 shadow-[inset_0_0_10px_rgba(0,0,0,0.8)] outline-none transition-all placeholder:text-cyan-900/50 focus:border-cyan-400 focus:shadow-[0_0_15px_rgba(34,211,238,0.15)]"
          placeholder="••••••••"
        />
      </label>

      {errorMessage && (
        <div className="mt-5 rounded-lg border border-rose-500/50 bg-rose-950/40 p-3 shadow-[0_0_15px_rgba(225,29,72,0.15)]">
          <p className="text-center text-[11px] font-black tracking-wider text-rose-300 uppercase">
            {errorMessage}
          </p>
        </div>
      )}

      <button
        type="submit"
        aria-label="Iniciar sesión"
        disabled={isPending}
        className="mt-6 w-full rounded-xl border border-cyan-400/50 bg-cyan-950/40 py-3 text-xs font-black uppercase tracking-widest text-cyan-100 shadow-[0_0_15px_rgba(34,211,238,0.1)] transition-all hover:bg-cyan-900/60 hover:border-cyan-300 hover:shadow-[0_0_25px_rgba(34,211,238,0.3)] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? "Conectando al Servidor..." : "Entrar al Hub"}
      </button>

      <p className="mt-6 border-t border-cyan-900/50 pt-4 text-center text-[10px] uppercase tracking-widest text-cyan-500/70">
        ¿No tienes identificador?{" "}
        <Link href="/register" className="font-black text-cyan-300 transition-colors hover:text-cyan-100 drop-shadow-[0_0_5px_rgba(34,211,238,0.4)]">
          Regístrate
        </Link>
      </p>
    </form>
  );
}