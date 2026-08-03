// scripts/supabase/prepare-local-migrations.test.ts - Verifica el orden numérico de migraciones locales.
import { describe, expect, it } from "vitest";
import { compareSqlFilenames, toMigrationPrefix } from "./prepare-local-migrations.mjs";

describe("compareSqlFilenames", () => {
  it("ordena prefijos numéricos sin colocar la serie 100 antes de la 010", () => {
    const filenames = [
      "103_new_card.sql",
      "030_extend_constraint.sql",
      "009_player_progress.sql",
      "149_buy_item.sql",
      "010_fusion_slots.sql",
    ];

    expect(filenames.sort(compareSqlFilenames)).toEqual([
      "009_player_progress.sql",
      "010_fusion_slots.sql",
      "030_extend_constraint.sql",
      "103_new_card.sql",
      "149_buy_item.sql",
    ]);
  });

  it("mantiene un desempate determinista cuando se repite el prefijo", () => {
    expect(["010_z.sql", "010_a.sql"].sort(compareSqlFilenames)).toEqual(["010_a.sql", "010_z.sql"]);
  });

  it("mantiene timestamps de 14 dígitos ordenados al superar 99 migraciones", () => {
    const prefix99 = toMigrationPrefix(98);
    const prefix100 = toMigrationPrefix(99);
    const prefix150 = toMigrationPrefix(149);

    expect(prefix99).toHaveLength(14);
    expect(prefix100).toHaveLength(14);
    expect([prefix150, prefix100, prefix99].sort()).toEqual([prefix99, prefix100, prefix150]);
  });
});
