// src/components/auth/internal/AuthErrorBanner.tsx - Banner de error accesible y de alto contraste para formularios de autenticación.

interface IAuthErrorBannerProps {
  message: string;
}

export function AuthErrorBanner({ message }: IAuthErrorBannerProps) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className="relative z-10 mt-6 border border-rose-500/70 bg-[#2a0911]/85 px-4 py-3 shadow-[0_0_22px_rgba(244,63,94,0.35)]"
      style={{ WebkitClipPath: "polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)" }}
    >
      <p className="flex items-center gap-2 font-mono text-xs font-black uppercase tracking-[0.14em] text-rose-200 sm:text-sm">
        <span aria-hidden className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-rose-300/40 bg-rose-600/80 text-xs text-rose-100">
          !
        </span>
        {message}
      </p>
    </div>
  );
}
