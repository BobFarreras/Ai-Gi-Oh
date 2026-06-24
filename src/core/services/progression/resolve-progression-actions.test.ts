// src/core/services/progression/resolve-progression-actions.test.ts - Cubre todas las combinaciones modo×resultado del mapeo de acciones de duelo.
import { describe, it, expect } from "vitest";
import { resolveDuelProgressionActions } from "./resolve-progression-actions";

describe("resolveDuelProgressionActions", () => {
  it("STORY perdido solo cuenta como duelo jugado", () => {
    expect(resolveDuelProgressionActions("STORY", false)).toEqual(["PLAY_DUEL"]);
  });
  it("STORY ganado añade WIN_DUEL", () => {
    expect(resolveDuelProgressionActions("STORY", true)).toEqual(["PLAY_DUEL", "WIN_DUEL"]);
  });
  it("TRAINING perdido cuenta duelo + arena jugados", () => {
    expect(resolveDuelProgressionActions("TRAINING", false)).toEqual(["PLAY_DUEL", "PLAY_ARENA"]);
  });
  it("TRAINING ganado añade victorias de duelo y arena", () => {
    expect(resolveDuelProgressionActions("TRAINING", true)).toEqual(["PLAY_DUEL", "PLAY_ARENA", "WIN_DUEL", "WIN_ARENA"]);
  });
  it("MULTIPLAYER perdido cuenta duelo + partida MP jugados", () => {
    expect(resolveDuelProgressionActions("MULTIPLAYER", false)).toEqual(["PLAY_DUEL", "PLAY_MP_MATCH"]);
  });
  it("MULTIPLAYER ganado añade victorias de duelo y MP", () => {
    expect(resolveDuelProgressionActions("MULTIPLAYER", true)).toEqual(["PLAY_DUEL", "PLAY_MP_MATCH", "WIN_DUEL", "WIN_MP_MATCH"]);
  });
});
