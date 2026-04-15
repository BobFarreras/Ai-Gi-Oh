// src/components/auth/ResetPasswordForm.tsx - Formulario para definir nueva contraseña tras validar enlace de recuperación.
"use client";

import Link from "next/link";
import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { AuthField } from "@/components/auth/internal/AuthField";
import { AuthErrorBanner } from "@/components/auth/internal/AuthErrorBanner";
import { authFormBeamVariants, authFormContainerVariants, buildAuthPieceVariants } from "@/components/auth/internal/formAnimation";
import { updateCurrentPassword } from "@/services/auth/auth-http-client";

export function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (password !== confirmPassword) {
      setErrorMessage("Las contraseñas no coinciden.");
      return;
    }
    setErrorMessage(null);
    setFeedbackMessage(null);
    startTransition(async () => {
      const result = await updateCurrentPassword(password);
      if (!result.ok) {
        setErrorMessage(result.message ?? "No se pudo actualizar la contraseña.");
        return;
      }
      setFeedbackMessage(result.message ?? "Contraseña actualizada correctamente.");
      router.push("/login");
      router.refresh();
    });
  }

  return (
    <motion.form variants={authFormContainerVariants} initial="hidden" animate="visible" onSubmit={handleSubmit} className="relative z-10 w-full overflow-hidden border border-cyan-900/60 bg-[#020813]/90 p-8 shadow-[0_0_60px_rgba(6,182,212,0.25)] backdrop-blur-xl" style={{ WebkitClipPath: "polygon(25px 0, 100% 0, 100% calc(100% - 25px), calc(100% - 25px) 100%, 0 100%, 0 25px)" }}>
      <motion.div variants={authFormBeamVariants} className="pointer-events-none absolute left-0 right-0 z-50 h-[3px] bg-white" style={{ boxShadow: "0 0 5px #fff, 0 0 15px #06b6d4, 0 0 30px #06b6d4, 0 0 60px #06b6d4, 0 0 90px #06b6d4" }} />
      <motion.div variants={buildAuthPieceVariants(0.8)} className="mb-8 border-b border-cyan-900/50 pb-6 text-center">
        <h1 className="text-2xl font-black uppercase tracking-[0.23em] text-cyan-50">Nueva <span className="text-cyan-500">Contraseña</span></h1>
        <p className="mt-3 font-mono text-xs uppercase tracking-[0.18em] text-cyan-500/80">Define una credencial segura para volver al hub.</p>
      </motion.div>
      <div className="space-y-5">
        <motion.div variants={buildAuthPieceVariants(0.6)}>
          <AuthField label="Nueva contraseña" ariaLabel="Nueva contraseña" type="password" value={password} autoComplete="new-password" placeholder="••••••••" onChange={setPassword} />
        </motion.div>
        <motion.div variants={buildAuthPieceVariants(0.45)}>
          <AuthField label="Confirmar contraseña" ariaLabel="Confirmar nueva contraseña" type="password" value={confirmPassword} autoComplete="new-password" placeholder="••••••••" onChange={setConfirmPassword} />
        </motion.div>
      </div>
      {errorMessage ? <AuthErrorBanner message={errorMessage} /> : null}
      {feedbackMessage ? <p className="mt-6 border border-cyan-800/70 bg-cyan-950/40 p-3 font-mono text-xs uppercase tracking-[0.12em] text-cyan-200">{feedbackMessage}</p> : null}
      <motion.button variants={buildAuthPieceVariants(0.2)} type="submit" aria-label="Actualizar contraseña" disabled={isPending} className="group relative z-10 mt-8 flex h-14 w-full items-center justify-center overflow-hidden bg-cyan-600 px-8 font-mono text-sm font-black uppercase tracking-[0.22em] text-black transition-all hover:bg-cyan-400 hover:shadow-[0_0_35px_rgba(6,182,212,0.7)] disabled:cursor-not-allowed disabled:bg-cyan-900/60 disabled:text-cyan-600 disabled:opacity-70">
        <span aria-hidden className="auth-cta-shine" />
        <span className="relative z-10">{isPending ? "Actualizando..." : "Actualizar acceso"}</span>
      </motion.button>
      <motion.p variants={buildAuthPieceVariants(0.1)} className="mt-7 text-center font-mono text-xs uppercase tracking-widest text-cyan-500/70">
        ¿Enlace inválido? <Link href="/recover-password" className="font-black text-cyan-400 transition-colors hover:text-white">Solicitar nuevo enlace</Link>
      </motion.p>
    </motion.form>
  );
}
