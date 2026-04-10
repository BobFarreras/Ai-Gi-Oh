// src/app/(auth)/recover-password/page.tsx - Página de recuperación de contraseña con formulario dedicado y fondo compartido.
import { RecoverPasswordForm } from "@/components/auth/RecoverPasswordForm";
import { BackToLandingButton } from "@/components/auth/BackToLandingButton";
import { CyberBackground } from "@/components/landing/CyberBackground";

export default function RecoverPasswordPage() {
  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-[#010308] p-4 sm:p-8 selection:bg-cyan-500/30">
      <CyberBackground />
      <BackToLandingButton />
      <div className="relative z-10 w-full max-w-md shrink-0">
        <RecoverPasswordForm />
      </div>
    </main>
  );
}
