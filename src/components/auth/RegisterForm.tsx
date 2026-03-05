// src/components/auth/RegisterForm.tsx - Formulario cliente para crear cuenta por email con feedback y navegación al login.
"use client";

import Link from "next/link";
import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { registerWithEmail } from "@/services/auth/auth-http-client";

export function RegisterForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (password !== confirmPassword) {
      setErrorMessage("Las contraseñas no coinciden.");
      return;
    }
    setErrorMessage(null);
    startTransition(async () => {
      const result = await registerWithEmail({ email, password });
      if (!result.ok) {
        setErrorMessage(result.message ?? "No se pudo crear la cuenta.");
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
      <h1 className="text-2xl font-black uppercase tracking-wider text-cyan-100">Crear Identidad Nexus</h1>
      <p className="mt-2 text-sm text-cyan-300/80">Registra tu perfil para acceder al hub del Arquitecto.</p>

      <label className="mt-5 block text-xs font-black uppercase tracking-wider text-cyan-300/85">
        Email
        <input
          aria-label="Email de registro"
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
          aria-label="Contraseña de registro"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          autoComplete="new-password"
          className="mt-1 w-full border border-cyan-800/55 bg-[#020a14]/90 px-3 py-2 text-sm text-cyan-50 outline-none focus:border-cyan-400"
        />
      </label>

      <label className="mt-4 block text-xs font-black uppercase tracking-wider text-cyan-300/85">
        Confirmar contraseña
        <input
          aria-label="Confirmar contraseña de registro"
          type="password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          required
          autoComplete="new-password"
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
        aria-label="Crear cuenta"
        disabled={isPending}
        className="mt-5 w-full border border-cyan-300/45 bg-cyan-500/15 py-2 text-xs font-black uppercase tracking-wider text-cyan-100 transition hover:bg-cyan-500/25 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Creando..." : "Activar Cuenta"}
      </button>

      <p className="mt-4 text-center text-xs text-cyan-300/75">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="font-black uppercase tracking-wide text-cyan-200 hover:text-cyan-100">
          Inicia sesión
        </Link>
      </p>
    </form>
  );
}
