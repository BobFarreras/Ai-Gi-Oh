// src/components/game/board/internal/resolve-board-theme-classes.test.ts - Verifica que Survival no hereda el ambiente carmesí.
import { describe, expect, it } from "vitest";
import { resolveBoardThemeClasses } from "./resolve-board-theme-classes";

describe("resolveBoardThemeClasses", () => {
  it("aplica ambiente verde Nexus al tema CYAN de Supervivencia", () => {
    const theme = resolveBoardThemeClasses(true, "CYAN");
    expect(theme.ambient).toContain("16,185,129");
    expect(theme.ambient).not.toContain("244,63,94");
  });
});
