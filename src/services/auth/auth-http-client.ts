// src/services/auth/auth-http-client.ts - Cliente HTTP del frontend para operaciones de autenticación sin server actions.
interface IAuthActionResult {
  ok: boolean;
  message: string | null;
}

interface IAuthPayload {
  email: string;
  password: string;
}

async function postAuth(url: string, payload?: IAuthPayload): Promise<IAuthActionResult> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload ? JSON.stringify(payload) : undefined,
    cache: "no-store",
  });
  const data = (await response.json()) as IAuthActionResult;
  if (!response.ok) {
    return { ok: false, message: data.message ?? "Error de autenticación." };
  }
  return data;
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
