// src/app/(auth)/reset-password/page.tsx - Página para establecer una nueva contraseña tras enlace de recuperación.
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { BackToLandingButton } from "@/components/auth/BackToLandingButton";
import { CyberBackground } from "@/components/landing/CyberBackground";

export default function ResetPasswordPage() {
  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-[#010308] p-4 sm:p-8 selection:bg-cyan-500/30">
      <CyberBackground />
      <BackToLandingButton />
      <div className="relative z-10 w-full max-w-md shrink-0">
        <ResetPasswordForm />
      </div>
    </main>
  );
}
