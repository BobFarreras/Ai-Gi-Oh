// src/components/hub/academy/tutorial/internal/tutorial-soundtrack-session.test.ts - Verifica activación/cierre del soundtrack de primera vuelta tutorial en sesión.
import { beforeEach, describe, expect, it } from "vitest";
import {
  isTutorialSoundtrackFirstRunActive,
  markTutorialSoundtrackFirstRunFinished,
  markTutorialSoundtrackFirstRunStarted,
} from "@/components/hub/academy/tutorial/internal/tutorial-soundtrack-session";

describe("tutorial-soundtrack-session", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  it("activa bandera de primera vuelta cuando se inicia guía", () => {
    markTutorialSoundtrackFirstRunStarted();
    expect(isTutorialSoundtrackFirstRunActive()).toBe(true);
  });

  it("desactiva y bloquea reactivación cuando la primera vuelta termina", () => {
    markTutorialSoundtrackFirstRunStarted();
    markTutorialSoundtrackFirstRunFinished();
    markTutorialSoundtrackFirstRunStarted();
    expect(isTutorialSoundtrackFirstRunActive()).toBe(false);
  });
});
