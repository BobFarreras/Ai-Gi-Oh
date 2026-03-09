// scripts/performance/baseline-server.mjs - Gestiona arranque temporal del servidor para medir baseline de forma autónoma.
import { spawn } from "node:child_process";

async function waitForUrl(url, timeoutMs) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(url, { method: "GET" });
      if (response.ok || response.status >= 300) return;
    } catch {
      // espera activa hasta que el servidor esté listo
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error(`No se pudo abrir ${url} dentro de ${timeoutMs}ms`);
}

export async function maybeStartServer(command, baseUrl) {
  if (!command) return null;
  const child = spawn(command, { shell: true, stdio: "ignore" });
  await waitForUrl(baseUrl, 90000);
  return child;
}

export function stopServer(child) {
  if (!child) return;
  if (process.platform === "win32") {
    spawn("taskkill", ["/pid", String(child.pid), "/t", "/f"], { shell: true, stdio: "ignore" });
    return;
  }
  child.kill("SIGTERM");
}
