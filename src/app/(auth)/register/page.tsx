// src/app/(auth)/register/page.tsx - Página de registro con fondo dinámico y formulario de alta de jugador.
import { RegisterForm } from "@/components/auth/RegisterForm";
import { BackToLandingButton } from "@/components/auth/BackToLandingButton";
import { CyberBackground } from "@/components/landing/CyberBackground";

export default function RegisterPage() {
  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-[#010308] p-4 sm:p-8 selection:bg-cyan-500/30">
      
      {/* Fondo interactivo de hiperconexiones */}
      <CyberBackground />
      <BackToLandingButton />
      
      {/* Contenedor del formulario */}
      <div className="relative z-10 w-full max-w-md shrink-0">
        <RegisterForm />
      </div>

    </main>
  );
}
