// src/app/login/page.tsx - Renderiza pantalla de acceso autenticado para proteger módulos del hub.
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <main className="hub-control-room-bg flex min-h-dvh items-center justify-center px-4 py-8">
      <LoginForm />
    </main>
  );
}
