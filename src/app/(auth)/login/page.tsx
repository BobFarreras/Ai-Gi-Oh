// src/app/(auth)/login/page.tsx - Página de acceso con fondo dinámico y formulario de login.
import { LoginForm } from "@/components/auth/LoginForm";
import { BackToLandingButton } from "@/components/auth/BackToLandingButton";
import { CyberBackground } from "@/components/landing/CyberBackground";

export default function LoginPage() {
  return (
    // relative y min-h-dvh aseguran que ocupe toda la pantalla.
    // bg-[#010308] mantiene el fondo oscuro si el Canvas tarda unos ms en cargar.
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-[#010308] p-4 sm:p-8 selection:bg-cyan-500/30">
      
      {/* Nuestro fondo interactivo de hiperconexiones */}
      <CyberBackground />
      <BackToLandingButton />
      
      {/* El contenedor del formulario con un z-index alto para estar sobre el Canvas */}
      <div className="relative z-10 w-full max-w-md shrink-0">
        <LoginForm />
      </div>

    </main>
  );
}
