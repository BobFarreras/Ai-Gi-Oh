// src/components/auth/LoginForm.tsx - Formulario de inicio de sesión con flujo HTTP y animaciones compartidas de autenticación.
"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { hasCurrentAdminSession, loginWithEmail } from "@/services/auth/auth-http-client";
import { AuthErrorBanner } from "@/components/auth/internal/AuthErrorBanner";
import { AuthField } from "@/components/auth/internal/AuthField";
import { authFormBeamVariants, authFormContainerVariants, buildAuthPieceVariants } from "@/components/auth/internal/formAnimation";
import { useAuthFormSfx } from "@/components/auth/internal/useAuthFormSfx";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { playButtonClick, playFormEntry } = useAuthFormSfx();

  useEffect(() => {
    playFormEntry();
  }, [playFormEntry]);

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    setErrorMessage(null);
    startTransition(async () => {
      const result = await loginWithEmail({ email, password });
      if (!result.ok) {
        setErrorMessage(result.message ?? "No se pudo iniciar sesión.");
        return;
      }
      const isAdminSession = await hasCurrentAdminSession();
      router.push(isAdminSession ? "/admin" : "/hub");
      router.refresh();
    });
  }

  return (
    <motion.form
      variants={authFormContainerVariants}
      initial="hidden"
      animate="visible"
      onSubmit={handleSubmit}
      className="relative z-10 w-full overflow-hidden border border-cyan-900/60 bg-[#020813]/90 p-8 shadow-[0_0_60px_rgba(6,182,212,0.25)] backdrop-blur-xl"
      style={{ WebkitClipPath: "polygon(25px 0, 100% 0, 100% calc(100% - 25px), calc(100% - 25px) 100%, 0 100%, 0 25px)" }}
    >
      <motion.div
        variants={authFormBeamVariants}
        className="pointer-events-none absolute left-0 right-0 z-50 h-[3px] bg-white"
        style={{ boxShadow: "0 0 5px #fff, 0 0 15px #06b6d4, 0 0 30px #06b6d4, 0 0 60px #06b6d4, 0 0 90px #06b6d4" }}
      />

      <motion.div variants={buildAuthPieceVariants(0.85)} className="mb-10 border-b border-cyan-900/50 pb-6 text-center">
        <h1 className="text-3xl font-black uppercase tracking-[0.25em] text-cyan-50 drop-shadow-[0_0_12px_rgba(6,182,212,0.7)]">
          Acceso <span className="text-cyan-500">Nexus</span>
        </h1>
        <p className="mt-3 font-mono text-xs uppercase tracking-[0.2em] text-cyan-500/80">Inicia secuencia en el hub del Arquitecto</p>
      </motion.div>

      <div className="relative z-10 space-y-7">
        <motion.div variants={buildAuthPieceVariants(0.65)}>
          <AuthField
            label="Identificador (Email)"
            ariaLabel="Email de acceso"
            type="email"
            value={email}
            autoComplete="email"
            placeholder="operador@nexus.com"
            onChange={setEmail}
          />
        </motion.div>
        <motion.div variants={buildAuthPieceVariants(0.45)}>
          <AuthField
            label="Llave Criptográfica"
            ariaLabel="Contraseña de acceso"
            type="password"
            value={password}
            autoComplete="current-password"
            placeholder="••••••••"
            onChange={setPassword}
          />
        </motion.div>
      </div>

      {errorMessage ? <AuthErrorBanner message={errorMessage} /> : null}

      <motion.button
        variants={buildAuthPieceVariants(0.25)}
        type="submit"
        aria-label="Iniciar sesión"
        onClick={playButtonClick}
        disabled={isPending}
        className="group relative z-10 mt-10 flex h-16 w-full items-center justify-center overflow-hidden bg-cyan-600 px-8 font-mono text-sm font-black uppercase tracking-[0.25em] text-black transition-all hover:bg-cyan-400 hover:shadow-[0_0_35px_rgba(6,182,212,0.7)] disabled:cursor-not-allowed disabled:bg-cyan-900/60 disabled:text-cyan-600 disabled:opacity-70"
        style={{ WebkitClipPath: "polygon(18px 0, 100% 0, 100% calc(100% - 18px), calc(100% - 18px) 100%, 0 100%, 0 18px)" }}
      >
        <div className="pointer-events-none absolute inset-0 -translate-x-full skew-x-12 bg-white/40 transition-transform duration-500 ease-out group-hover:translate-x-full" />
        <span className="relative z-10 drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]">{isPending ? "Conectando al Core..." : "Entrar al Hub"}</span>
      </motion.button>

      <motion.p variants={buildAuthPieceVariants(0.1)} className="relative z-10 mt-10 text-center font-mono text-xs uppercase tracking-widest text-cyan-500/70">
        ¿No tienes identificador?{" "}
        <Link href="/register" onClick={playButtonClick} className="font-black text-cyan-400 transition-colors hover:text-white hover:drop-shadow-[0_0_12px_rgba(6,182,212,0.9)]">
          Compilar Nuevo Nodo
        </Link>
      </motion.p>
    </motion.form>
  );
}
