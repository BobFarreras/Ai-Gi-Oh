// src/components/auth/RecoverPasswordForm.tsx - Formulario para solicitar enlace de recuperación de contraseña por email.
"use client";

import Link from "next/link";
import { FormEvent, useState, useTransition } from "react";
import { motion } from "framer-motion";
import { AuthField } from "@/components/auth/internal/AuthField";
import { AuthErrorBanner } from "@/components/auth/internal/AuthErrorBanner";
import { authFormBeamVariants, authFormContainerVariants, buildAuthPieceVariants } from "@/components/auth/internal/formAnimation";
import { requestPasswordRecovery } from "@/services/auth/auth-http-client";

export function RecoverPasswordForm() {
  const [email, setEmail] = useState("");
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    setErrorMessage(null);
    setFeedbackMessage(null);
    startTransition(async () => {
      const result = await requestPasswordRecovery(email);
      if (!result.ok) {
        setErrorMessage(result.message ?? "No se pudo iniciar la recuperación.");
        return;
      }
      setFeedbackMessage(result.message ?? "Si existe una cuenta, recibirás un enlace para recuperar tu acceso.");
    });
  }

  return (
    <motion.form variants={authFormContainerVariants} initial="hidden" animate="visible" onSubmit={handleSubmit} className="relative z-10 w-full overflow-hidden border border-cyan-900/60 bg-[#020813]/90 p-8 shadow-[0_0_60px_rgba(6,182,212,0.25)] backdrop-blur-xl" style={{ WebkitClipPath: "polygon(25px 0, 100% 0, 100% calc(100% - 25px), calc(100% - 25px) 100%, 0 100%, 0 25px)" }}>
      <motion.div variants={authFormBeamVariants} className="pointer-events-none absolute left-0 right-0 z-50 h-[3px] bg-white" style={{ boxShadow: "0 0 5px #fff, 0 0 15px #06b6d4, 0 0 30px #06b6d4, 0 0 60px #06b6d4, 0 0 90px #06b6d4" }} />
      <motion.div variants={buildAuthPieceVariants(0.8)} className="mb-8 border-b border-cyan-900/50 pb-6 text-center">
        <h1 className="text-2xl font-black uppercase tracking-[0.23em] text-cyan-50">Recuperar <span className="text-cyan-500">Acceso</span></h1>
        <p className="mt-3 font-mono text-xs uppercase tracking-[0.18em] text-cyan-500/80">Te enviaremos un enlace seguro al email.</p>
      </motion.div>
      <motion.div variants={buildAuthPieceVariants(0.55)}>
        <AuthField label="Email de recuperación" ariaLabel="Email para recuperar contraseña" type="email" value={email} autoComplete="email" placeholder="operador@nexus.com" onChange={setEmail} />
      </motion.div>
      {errorMessage ? <AuthErrorBanner message={errorMessage} /> : null}
      {feedbackMessage ? <p className="mt-6 border border-cyan-800/70 bg-cyan-950/40 p-3 font-mono text-xs uppercase tracking-[0.12em] text-cyan-200">{feedbackMessage}</p> : null}
      <motion.button variants={buildAuthPieceVariants(0.25)} type="submit" aria-label="Enviar enlace de recuperación" disabled={isPending} className="group relative z-10 mt-8 flex h-14 w-full items-center justify-center overflow-hidden bg-cyan-600 px-8 font-mono text-sm font-black uppercase tracking-[0.22em] text-black transition-all hover:bg-cyan-400 hover:shadow-[0_0_35px_rgba(6,182,212,0.7)] disabled:cursor-not-allowed disabled:bg-cyan-900/60 disabled:text-cyan-600 disabled:opacity-70">
        <div className="pointer-events-none absolute inset-0 -translate-x-full skew-x-12 bg-white/40 transition-transform duration-500 ease-out group-hover:translate-x-full" />
        <span className="relative z-10">{isPending ? "Enviando..." : "Enviar enlace"}</span>
      </motion.button>
      <motion.p variants={buildAuthPieceVariants(0.1)} className="mt-7 text-center font-mono text-xs uppercase tracking-widest text-cyan-500/70">
        ¿Recordaste tu clave? <Link href="/login" className="font-black text-cyan-400 transition-colors hover:text-white">Volver a login</Link>
      </motion.p>
    </motion.form>
  );
}
