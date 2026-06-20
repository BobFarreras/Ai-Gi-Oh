// scripts/lib/supabase-cli.mjs - Resuelve un CLI de Supabase usable sin depender del postinstall del paquete npm.
//
// El paquete npm `supabase` descarga un binario en su postinstall que falla a menudo en Windows
// (ENOENT del .EXE, errores de certificado TLS, cortes de red), tumbando `pnpm install` entero.
// Para que el setup sea reproducible, NO dependemos de ese binario: detectamos un CLI usable en este
// orden y devolvemos cómo invocarlo. Si no hay ninguno, el llamador muestra instrucciones de instalación.
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";

/**
 * Resuelve cómo invocar el CLI de Supabase.
 *
 * Dependencias inyectables (para tests):
 * - platform: "win32" | "darwin" | "linux"
 * - repoRoot: raíz del repo
 * - fileExists(path) -> boolean
 * - onPath(commandName) -> string | null  (ruta absoluta si está en PATH, null si no)
 *
 * Devuelve: { found, command, prefixArgs, source } donde source ∈ "local" | "global".
 */
export function resolveSupabaseCli({
  platform = process.platform,
  repoRoot = process.cwd(),
  env = process.env,
  fileExists = existsSync,
  onPath = defaultOnPath,
} = {}) {
  const isWindows = platform === "win32";
  const binDir = path.join(repoRoot, "node_modules", ".bin");
  const localCandidates = isWindows
    ? [path.join(binDir, "supabase.cmd"), path.join(binDir, "supabase.CMD"), path.join(binDir, "supabase.exe"), path.join(binDir, "supabase.EXE")]
    : [path.join(binDir, "supabase")];

  // 1) Binario local en node_modules/.bin.
  for (const candidate of localCandidates) {
    if (fileExists(candidate)) {
      return { found: true, command: candidate, prefixArgs: [], source: "local" };
    }
  }

  // 2) En el PATH (la vía normal). Si está, basta con invocar "supabase".
  if (onPath("supabase")) {
    return { found: true, command: "supabase", prefixArgs: [], source: "global" };
  }

  // 3) Ubicaciones conocidas de instaladores (scoop/brew/winget/choco). Cubre el caso de tener
  //    supabase instalado pero con su carpeta fuera del PATH de esa terminal — usamos la ruta absoluta.
  for (const candidate of knownInstallLocations(platform, env)) {
    if (fileExists(candidate)) {
      return { found: true, command: candidate, prefixArgs: [], source: "system" };
    }
  }

  return { found: false, command: null, prefixArgs: [], source: null };
}

/** Rutas habituales donde scoop/brew/winget/choco dejan el binario `supabase`. */
export function knownInstallLocations(platform = process.platform, env = process.env) {
  if (platform === "win32") {
    const home = env.USERPROFILE || env.HOME || "";
    const localAppData = env.LOCALAPPDATA || "";
    const locations = [];
    if (home) {
      locations.push(path.join(home, "scoop", "shims", "supabase.exe"));
      locations.push(path.join(home, "scoop", "shims", "supabase.cmd"));
      locations.push(path.join(home, "scoop", "apps", "supabase", "current", "supabase.exe"));
    }
    if (localAppData) locations.push(path.join(localAppData, "Microsoft", "WinGet", "Links", "supabase.exe"));
    locations.push("C:\\ProgramData\\chocolatey\\bin\\supabase.exe");
    return locations;
  }
  const home = env.HOME || "";
  const locations = ["/opt/homebrew/bin/supabase", "/usr/local/bin/supabase", "/usr/bin/supabase"];
  if (home) locations.push(path.join(home, ".local", "bin", "supabase"));
  return locations;
}

/** Comprobación real de PATH multiplataforma. */
export function defaultOnPath(commandName) {
  const finder = process.platform === "win32" ? "where" : "which";
  const result = spawnSync(finder, [commandName], { encoding: "utf8", shell: process.platform === "win32" });
  if (result.status !== 0 || !result.stdout) return null;
  const firstLine = result.stdout.split(/\r?\n/).map((line) => line.trim()).find((line) => line.length > 0);
  return firstLine ?? null;
}

/** Instrucciones de instalación del CLI de Supabase según plataforma. */
export function getSupabaseInstallHint(platform = process.platform) {
  if (platform === "win32") {
    return {
      title: "Instala el CLI de Supabase (Windows):",
      commands: [
        "scoop bucket add supabase https://github.com/supabase/scoop-bucket.git",
        "scoop install supabase",
      ],
      fallback: "Alternativa sin scoop: descarga el binario desde https://github.com/supabase/cli/releases y añádelo al PATH.",
    };
  }
  if (platform === "darwin") {
    return {
      title: "Instala el CLI de Supabase (macOS):",
      commands: ["brew install supabase/tap/supabase"],
      fallback: "Alternativa: https://github.com/supabase/cli#install-the-cli",
    };
  }
  return {
    title: "Instala el CLI de Supabase (Linux):",
    commands: [
      "# Homebrew en Linux:",
      "brew install supabase/tap/supabase",
    ],
    fallback: "Alternativa: descarga el .deb/.rpm desde https://github.com/supabase/cli/releases",
  };
}

/** Ejecuta el CLI de Supabase resuelto con los argumentos dados (stdio heredado). */
export function runSupabase(cli, args, options = {}) {
  return spawnSync(cli.command, [...cli.prefixArgs, ...args], {
    stdio: "inherit",
    shell: process.platform === "win32",
    ...options,
  });
}
