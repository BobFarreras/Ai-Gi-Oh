// scripts/lib/supabase-cli.test.ts - Verifica la resolución del CLI de Supabase y los mensajes de instalación.
import { describe, it, expect } from "vitest";
import path from "node:path";
import type { PathLike } from "node:fs";
import { resolveSupabaseCli, getSupabaseInstallHint, getSupabaseDownloadInfo } from "./supabase-cli.mjs";

const repoRoot = "C:/repo";

describe("resolveSupabaseCli", () => {
  it("prefiere el binario local de node_modules en Windows (.cmd)", () => {
    const localCmd = path.win32.join(repoRoot, "node_modules", ".bin", "supabase.cmd");
    const result = resolveSupabaseCli({
      platform: "win32",
      repoRoot,
      fileExists: (p: PathLike) => p === localCmd,
      onPath: () => "C:/scoop/shims/supabase",
    });
    expect(result.found).toBe(true);
    expect(result.source).toBe("local");
    expect(result.command).toBe(localCmd);
  });

  it("cae al CLI global del PATH cuando no hay binario local", () => {
    const result = resolveSupabaseCli({
      platform: "win32",
      repoRoot,
      fileExists: () => false,
      onPath: (name: string) => (name === "supabase" ? "C:/scoop/shims/supabase" : null),
    });
    expect(result.found).toBe(true);
    expect(result.source).toBe("global");
    expect(result.command).toBe("supabase");
  });

  it("encuentra supabase en scoop aunque NO esté en el PATH (caso del fallo real)", () => {
    const scoopShim = path.win32.join("C:\\Users\\Boby", "scoop", "shims", "supabase.exe");
    const result = resolveSupabaseCli({
      platform: "win32",
      repoRoot,
      env: { USERPROFILE: "C:\\Users\\Boby" },
      fileExists: (p: PathLike) => p === scoopShim,
      onPath: () => null, // scoop NO está en el PATH de esa terminal
    });
    expect(result.found).toBe(true);
    expect(result.source).toBe("system");
    expect(result.command).toBe(scoopShim);
  });

  it("encuentra supabase en brew (macOS) fuera del PATH", () => {
    const result = resolveSupabaseCli({
      platform: "darwin",
      repoRoot,
      env: { HOME: "/Users/boby" },
      fileExists: (p: PathLike) => p === "/opt/homebrew/bin/supabase",
      onPath: () => null,
    });
    expect(result.found).toBe(true);
    expect(result.source).toBe("system");
  });

  it("devuelve found:false cuando no hay CLI en ningún sitio", () => {
    const result = resolveSupabaseCli({
      platform: "linux",
      repoRoot,
      env: {},
      fileExists: () => false,
      onPath: () => null,
    });
    expect(result.found).toBe(false);
    expect(result.command).toBeNull();
  });

  it("encuentra el binario descargado en .bin (managed) antes que el PATH", () => {
    const managed = path.win32.join("C:/repo", ".bin", "supabase.exe");
    const result = resolveSupabaseCli({
      platform: "win32",
      repoRoot: "C:/repo",
      fileExists: (p: PathLike) => p === managed,
      onPath: () => null,
    });
    expect(result.found).toBe(true);
    expect(result.source).toBe("managed");
    expect(result.command).toBe(managed);
  });

  it("resuelve el binario local sin extensión en Linux", () => {
    const localBin = path.posix.join(repoRoot, "node_modules", ".bin", "supabase");
    const result = resolveSupabaseCli({
      platform: "linux",
      repoRoot,
      fileExists: (p: PathLike) => p === localBin,
      onPath: () => null,
    });
    expect(result.found).toBe(true);
    expect(result.source).toBe("local");
  });
});

describe("getSupabaseInstallHint", () => {
  it("sugiere scoop en Windows", () => {
    const hint = getSupabaseInstallHint("win32");
    expect(hint.commands.join(" ")).toContain("scoop");
  });

  it("sugiere brew en macOS", () => {
    const hint = getSupabaseInstallHint("darwin");
    expect(hint.commands.join(" ")).toContain("brew");
  });

  it("incluye siempre un fallback documentado", () => {
    for (const platform of ["win32", "darwin", "linux"] as const) {
      expect(getSupabaseInstallHint(platform).fallback).toMatch(/github\.com\/supabase/);
    }
  });
});

describe("getSupabaseDownloadInfo", () => {
  it("construye la URL del .tar.gz de Windows amd64", () => {
    const info = getSupabaseDownloadInfo("win32", "x64", "2.107.0");
    expect(info.archiveName).toBe("supabase_windows_amd64.tar.gz");
    expect(info.binaryName).toBe("supabase.exe");
    expect(info.url).toBe("https://github.com/supabase/cli/releases/download/v2.107.0/supabase_windows_amd64.tar.gz");
  });

  it("mapea arch arm64 y SO mac/linux", () => {
    expect(getSupabaseDownloadInfo("darwin", "arm64", "2.107.0").archiveName).toBe("supabase_darwin_arm64.tar.gz");
    expect(getSupabaseDownloadInfo("linux", "x64", "2.107.0").archiveName).toBe("supabase_linux_amd64.tar.gz");
    expect(getSupabaseDownloadInfo("linux", "arm64", "2.107.0").binaryName).toBe("supabase");
  });
});
