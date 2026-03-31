// src/components/auth/RegisterForm.tsx - Formulario de alta con validación de contraseña y animaciones compartidas de autenticación.
"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { registerWithEmail } from "@/services/auth/auth-http-client";
import { AuthErrorBanner } from "@/components/auth/internal/AuthErrorBanner";
import { AuthField } from "@/components/auth/internal/AuthField";
import { authFormBeamVariants, authFormContainerVariants, buildAuthPieceVariants } from "@/components/auth/internal/formAnimation";
import { useAuthFormSfx } from "@/components/auth/internal/useAuthFormSfx";

export function RegisterForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { playButtonClick, playFormEntry } = useAuthFormSfx();

  useEffect(() => {
    playFormEntry();
  }, [playFormEntry]);

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (password !== confirmPassword) {
      setErrorMessage("Las credenciales no coinciden.");
      return;
    }
    setErrorMessage(null);
    startTransition(async () => {
      const result = await registerWithEmail({ email, password });
      if (!result.ok) {
        setErrorMessage(result.message ?? "Error en la creación de perfil.");
        return;
      }
      router.push("/hub");
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

      <motion.div variants={buildAuthPieceVariants(0.85)} className="mb-8 border-b border-cyan-900/50 pb-6 text-center">
        <h1 className="text-2xl font-black uppercase tracking-[0.25em] text-cyan-50 drop-shadow-[0_0_12px_rgba(6,182,212,0.7)] sm:text-3xl">
          Identidad <span className="text-cyan-500">Nexus</span>
        </h1>
        <p className="mt-3 font-mono text-xs uppercase tracking-[0.2em] text-cyan-500/80">Registra tu perfil en el sistema</p>
      </motion.div>

      <div className="relative z-10 space-y-5">
        <motion.div variants={buildAuthPieceVariants(0.7)}>
          <AuthField
            label="Email"
            ariaLabel="Email de registro"
            type="email"
            value={email}
            autoComplete="email"
            placeholder="nuevo.operador@nexus.com"
            onChange={setEmail}
          />
        </motion.div>
        <motion.div variants={buildAuthPieceVariants(0.55)}>
          <AuthField
            label="Contraseña"
            ariaLabel="Contraseña de registro"
            type="password"
            value={password}
            autoComplete="new-password"
            placeholder="••••••••"
            onChange={setPassword}
          />
        </motion.div>
        <motion.div variants={buildAuthPieceVariants(0.4)}>
          <AuthField
            label="Confirmar credencial"
            ariaLabel="Confirmar contraseña de registro"
            type="password"
            value={confirmPassword}
            autoComplete="new-password"
            placeholder="••••••••"
            onChange={setConfirmPassword}
          />
        </motion.div>
      </div>

      {errorMessage ? <AuthErrorBanner message={errorMessage} /> : null}

      <motion.button
        variants={buildAuthPieceVariants(0.2)}
        type="submit"
        aria-label="Crear cuenta"
        onClick={playButtonClick}
        disabled={isPending}
        className="group relative z-10 mt-8 flex h-14 w-full items-center justify-center overflow-hidden bg-cyan-600 px-8 font-mono text-sm font-black uppercase tracking-[0.25em] text-black transition-all hover:bg-cyan-400 hover:shadow-[0_0_35px_rgba(6,182,212,0.7)] disabled:cursor-not-allowed disabled:bg-cyan-900/60 disabled:text-cyan-600 disabled:opacity-70 sm:h-16"
        style={{ WebkitClipPath: "polygon(18px 0, 100% 0, 100% calc(100% - 18px), calc(100% - 18px) 100%, 0 100%, 0 18px)" }}
      >
        <div className="pointer-events-none absolute inset-0 -translate-x-full skew-x-12 bg-white/40 transition-transform duration-500 ease-out group-hover:translate-x-full" />
        <span className="relative z-10 drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]">{isPending ? "Procesando..." : "Activar Cuenta"}</span>
      </motion.button>

      <motion.p variants={buildAuthPieceVariants(0.1)} className="relative z-10 mt-8 text-center font-mono text-[10px] uppercase tracking-widest text-cyan-500/70 sm:text-xs">
        ¿Identidad ya registrada?{" "}
        <Link href="/login" onClick={playButtonClick} className="font-black text-cyan-400 transition-colors hover:text-white hover:drop-shadow-[0_0_12px_rgba(6,182,212,0.9)]">
          Inicia sesión
        </Link>
      </motion.p>
    </motion.form>
  );
}
