// scripts/lib/cli-ui.test.ts - Verifica el formateo del toolkit de UI de terminal.
import { describe, it, expect } from "vitest";
import { banner, statusLine, stripAnsi, section } from "./cli-ui.mjs";

describe("cli-ui", () => {
  it("el banner contiene la marca AI-GI-OH y el subtítulo", () => {
    const text = stripAnsi(banner());
    // El arte ASCII se compone de bloques, comprobamos que el subtítulo identifica el proyecto.
    expect(text).toContain("Setup de contribuidor local");
    expect(text.split("\n").length).toBeGreaterThan(5);
  });

  it("statusLine incluye el texto y un detalle opcional", () => {
    expect(stripAnsi(statusLine("ok", "Docker activo"))).toContain("Docker activo");
    expect(stripAnsi(statusLine("ok", "Node", "v22"))).toContain("— v22");
  });

  it("usa iconos distintos para ok y fail", () => {
    const ok = stripAnsi(statusLine("ok", "x"));
    const fail = stripAnsi(statusLine("fail", "x"));
    expect(ok).not.toEqual(fail);
  });

  it("stripAnsi elimina los códigos de color", () => {
    // Cadena ANSI explícita: el test no depende de si la terminal tiene color activado
    // (en CI no-TTY el color se desactiva, así que no podemos asumir que section() lo emita).
    const colored = "[36m[1mHola[0m";
    expect(stripAnsi(colored)).toBe("Hola");
    expect(stripAnsi(colored)).not.toContain("");
  });

  it("section devuelve el título en mayúsculas", () => {
    expect(stripAnsi(section("Prueba"))).toContain("PRUEBA");
  });
});
