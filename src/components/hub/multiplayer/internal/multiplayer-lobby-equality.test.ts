// src/components/hub/multiplayer/internal/multiplayer-lobby-equality.test.ts - Tests puros de comparadores de igualdad del lobby multijugador.
import { describe, expect, it } from "vitest";
import {
  areEqualInvitationBannerProps,
  areEqualOnlinePlayerProps,
} from "./multiplayer-lobby-equality";
import { IOnlinePlayer, OnlinePlayerStatus } from "@/core/entities/multiplayer/IOnlinePlayer";
import {
  IPlayerInvitation,
  InvitationStatus,
} from "@/core/entities/multiplayer/IPlayerInvitation";

const player: IOnlinePlayer = {
  playerId: "p1",
  nickname: "Aria",
  status: "IDLE",
};

const invitation: IPlayerInvitation = {
  id: "inv1",
  fromId: "p2",
  fromNickname: "Rival",
  toId: "p1",
  status: "PENDING",
  matchId: null,
  deckIds: ["c1"],
  expiresAt: "2026-01-01T00:00:30.000Z",
  createdAt: "2026-01-01T00:00:00.000Z",
};

describe("areEqualOnlinePlayerProps", () => {
  it("devuelve true si todos los campos relevantes coinciden (refs distintas)", () => {
    const prev = { player, inviteSent: false, canInvite: true };
    const next = { player: { ...player }, inviteSent: false, canInvite: true };
    expect(areEqualOnlinePlayerProps(prev, next)).toBe(true);
  });

  it("devuelve false si cambia el status", () => {
    const prev = { player, inviteSent: false, canInvite: true };
    const next = { player: { ...player, status: "IN_MATCH" as OnlinePlayerStatus }, inviteSent: false, canInvite: true };
    expect(areEqualOnlinePlayerProps(prev, next)).toBe(false);
  });

  it("devuelve false si cambia inviteSent", () => {
    const prev = { player, inviteSent: false, canInvite: true };
    const next = { player, inviteSent: true, canInvite: true };
    expect(areEqualOnlinePlayerProps(prev, next)).toBe(false);
  });

  it("devuelve false si cambia canInvite", () => {
    const prev = { player, inviteSent: false, canInvite: true };
    const next = { player, inviteSent: false, canInvite: false };
    expect(areEqualOnlinePlayerProps(prev, next)).toBe(false);
  });

  it("devuelve false si cambia el nickname", () => {
    const prev = { player, inviteSent: false, canInvite: true };
    const next = { player: { ...player, nickname: "Otro" }, inviteSent: false, canInvite: true };
    expect(areEqualOnlinePlayerProps(prev, next)).toBe(false);
  });
});

describe("areEqualInvitationBannerProps", () => {
  it("devuelve true si id/status/nickname/expiresAt/isResponding coinciden", () => {
    const prev = { invitation, isResponding: false };
    const next = { invitation: { ...invitation }, isResponding: false };
    expect(areEqualInvitationBannerProps(prev, next)).toBe(true);
  });

  it("devuelve false si cambia isResponding", () => {
    const prev = { invitation, isResponding: false };
    const next = { invitation, isResponding: true };
    expect(areEqualInvitationBannerProps(prev, next)).toBe(false);
  });

  it("devuelve false si cambia el status", () => {
    const prev = { invitation, isResponding: false };
    const next = { invitation: { ...invitation, status: "ACCEPTED" as InvitationStatus }, isResponding: false };
    expect(areEqualInvitationBannerProps(prev, next)).toBe(false);
  });

  it("devuelve false si cambia expiresAt", () => {
    const prev = { invitation, isResponding: false };
    const next = { invitation: { ...invitation, expiresAt: "2026-01-01T00:00:45.000Z" }, isResponding: false };
    expect(areEqualInvitationBannerProps(prev, next)).toBe(false);
  });
});
