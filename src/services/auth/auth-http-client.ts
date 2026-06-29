// src/services/auth/auth-http-client.ts - Cliente HTTP del frontend para operaciones de autenticación sin server actions.
interface IAuthActionResult {
  ok: boolean;
  message: string | null;
}

interface IAuthPayload {
  email?: string;
  password?: string;
}

/** Mensaje de respaldo cuando el servidor no devuelve un cuerpo JSON utilizable (p. ej. un 500). */
function fallbackMessageForStatus(status: number): string {
  if (status === 429) return "Demasiados intentos. Espera unos minutos e inténtalo de nuevo.";
  if (status === 401 || status === 400) return "Datos incorrectos. Revísalos e inténtalo de nuevo.";
  if (status >= 500) return "Error del servidor. Inténtalo de nuevo en un momento.";
  return "No se pudo completar la operación. Inténtalo de nuevo.";
}

async function postAuth(url: string, payload?: IAuthPayload): Promise<IAuthActionResult> {
  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload ? JSON.stringify(payload) : undefined,
      cache: "no-store",
    });
  } catch {
    // Fallo de red / sin conexión: nunca lanzamos, devolvemos un resultado con mensaje.
    return { ok: false, message: "No se pudo conectar. Revisa tu conexión e inténtalo de nuevo." };
  }

  // Parseo defensivo: la respuesta puede no ser JSON (p. ej. un 500 con "Internal Server Error").
  // Si lo era, `json()` lanzaría y rompería la UI; aquí lo capturamos y mostramos un mensaje claro.
  const data = (await response.json().catch(() => null)) as IAuthActionResult | null;

  if (!response.ok || !data || data.ok === false) {
    return { ok: false, message: data?.message ?? fallbackMessageForStatus(response.status) };
  }
  return { ok: true, message: data.message ?? null };
}

/**
 * Comprueba en servidor si la sesión actual tiene permisos administrativos activos.
 */
export async function hasCurrentAdminSession(): Promise<boolean> {
  try {
    const response = await fetch("/api/admin/session", { method: "GET", cache: "no-store" });
    return response.ok;
  } catch {
    return false;
  }
}

export function loginWithEmail(payload: IAuthPayload): Promise<IAuthActionResult> {
  return postAuth("/api/auth/login", payload);
}

export function registerWithEmail(payload: IAuthPayload): Promise<IAuthActionResult> {
  return postAuth("/api/auth/register", payload);
}

export function logoutCurrentUser(): Promise<IAuthActionResult> {
  return postAuth("/api/auth/logout");
}

export function requestPasswordRecovery(email: string): Promise<IAuthActionResult> {
  return postAuth("/api/auth/recover", { email });
}

export function updateCurrentPassword(password: string): Promise<IAuthActionResult> {
  return postAuth("/api/auth/update-password", { password });
}
