import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    // fixed inset-0: Clava la pantalla a las 4 esquinas del monitor (ancho y alto exactos, 0 scroll nativo)
    // flex flex-col + p-4: Prepara el terreno y da aire por los bordes
    <main className="hub-control-room-bg fixed inset-0 flex flex-col overflow-y-auto overflow-x-hidden p-4 sm:p-8">
      
      {/* m-auto: Este es el truco de magia. Centra la caja vertical y horizontalmente. 
          Si la pantalla es muy pequeña, anula el centrado y activa el scroll limpiamente */}
      <div className="m-auto w-full max-w-md shrink-0">
        <LoginForm />
      </div>

    </main>
  );
}