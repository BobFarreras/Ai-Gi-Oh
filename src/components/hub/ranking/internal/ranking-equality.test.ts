// src/components/hub/ranking/internal/ranking-equality.test.ts - Tests puros del comparador de igualdad de filas del ranking.
import { describe, expect, it } from "vitest";
import { areEqualRankingRowProps } from "./ranking-equality";
import { IRankingEntry } from "@/services/ranking/get-ranking-data";

const entry: IRankingEntry = {
  rank: 5,
  playerId: "p1",
  nickname: "Aria",
  avatarUrl: null,
  eloRating: 1450,
  wins: 7,
  losses: 3,
};

describe("areEqualRankingRowProps", () => {
  it("devuelve true si todos los campos relevantes coinciden (refs distintas)", () => {
    const prev = { entry, isLocal: false };
    const next = { entry: { ...entry }, isLocal: false };
    expect(areEqualRankingRowProps(prev, next)).toBe(true);
  });

  it("devuelve false si cambia isLocal", () => {
    const prev = { entry, isLocal: false };
    const next = { entry, isLocal: true };
    expect(areEqualRankingRowProps(prev, next)).toBe(false);
  });

  it("devuelve false si cambia el rank", () => {
    const prev = { entry, isLocal: false };
    const next = { entry: { ...entry, rank: 6 }, isLocal: false };
    expect(areEqualRankingRowProps(prev, next)).toBe(false);
  });

  it("devuelve false si cambia el ELO", () => {
    const prev = { entry, isLocal: false };
    const next = { entry: { ...entry, eloRating: 1451 }, isLocal: false };
    expect(areEqualRankingRowProps(prev, next)).toBe(false);
  });

  it("devuelve false si cambian las victorias", () => {
    const prev = { entry, isLocal: false };
    const next = { entry: { ...entry, wins: 8 }, isLocal: false };
    expect(areEqualRankingRowProps(prev, next)).toBe(false);
  });

  it("devuelve false si cambian las derrotas", () => {
    const prev = { entry, isLocal: false };
    const next = { entry: { ...entry, losses: 4 }, isLocal: false };
    expect(areEqualRankingRowProps(prev, next)).toBe(false);
  });

  it("devuelve false si cambia el avatarUrl", () => {
    const prev = { entry, isLocal: false };
    const next = { entry: { ...entry, avatarUrl: "https://x.com/a.png" }, isLocal: false };
    expect(areEqualRankingRowProps(prev, next)).toBe(false);
  });

  it("devuelve false si cambia el nickname", () => {
    const prev = { entry, isLocal: false };
    const next = { entry: { ...entry, nickname: "Otro" }, isLocal: false };
    expect(areEqualRankingRowProps(prev, next)).toBe(false);
  });
});
