// src/core/hooks/multiplayer/useMatchFinishListener.test.ts - Tests del listener de fin de partida remoto vía postgres_changes.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";

// Mock del cliente Supabase browser: capturamos el callback de postgres_changes.
type PostgresChangeHandler = (payload: { new: { id: string; status: string; winner_id: string | null } }) => void;
const removeChannel = vi.fn();
let postgresChangeHandler: PostgresChangeHandler | null = null;

vi.mock("@/infrastructure/persistence/supabase/internal/create-supabase-browser-client", () => ({
  createSupabaseBrowserClient: () => ({
    channel: () => ({
      on: (_event: string, _filter: unknown, handler: PostgresChangeHandler) => {
        postgresChangeHandler = handler;
        return {
          subscribe: () => ({ CLOSED: "CLOSED" }),
        };
      },
      subscribe: () => ({ CLOSED: "CLOSED" }),
    }),
    removeChannel,
  }),
}));

import { useMatchFinishListener } from "./useMatchFinishListener";

describe("useMatchFinishListener", () => {
  beforeEach(() => {
    postgresChangeHandler = null;
    removeChannel.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("no se suscribe cuando disabled=true", () => {
    renderHook(() =>
      useMatchFinishListener({ matchId: "m1", onMatchFinished: vi.fn(), disabled: true }),
    );
    expect(postgresChangeHandler).toBeNull();
  });

  it("invoca onMatchFinished al recibir UPDATE con status FINISHED", () => {
    const onMatchFinished = vi.fn();
    renderHook(() =>
      useMatchFinishListener({ matchId: "m1", onMatchFinished, disabled: false }),
    );
    expect(postgresChangeHandler).not.toBeNull();
    postgresChangeHandler!({ new: { id: "m1", status: "FINISHED", winner_id: "p-a" } });
    expect(onMatchFinished).toHaveBeenCalledWith({ winnerId: "p-a", status: "FINISHED" });
  });

  it("invoca onMatchFinished con status ABANDONED y winner_id null si el servidor lo marca así", () => {
    const onMatchFinished = vi.fn();
    renderHook(() =>
      useMatchFinishListener({ matchId: "m1", onMatchFinished }),
    );
    postgresChangeHandler!({ new: { id: "m1", status: "ABANDONED", winner_id: null } });
    expect(onMatchFinished).toHaveBeenCalledWith({ winnerId: null, status: "ABANDONED" });
  });

  it("ignora UPDATEs que no cierran la partida (WAITING/ACTIVE)", () => {
    const onMatchFinished = vi.fn();
    renderHook(() =>
      useMatchFinishListener({ matchId: "m1", onMatchFinished }),
    );
    postgresChangeHandler!({ new: { id: "m1", status: "ACTIVE", winner_id: null } });
    expect(onMatchFinished).not.toHaveBeenCalled();
  });

  it("solo dispara onMatchFinished una vez (idempotente ante múltiples UPDATEs)", () => {
    const onMatchFinished = vi.fn();
    renderHook(() =>
      useMatchFinishListener({ matchId: "m1", onMatchFinished }),
    );
    postgresChangeHandler!({ new: { id: "m1", status: "FINISHED", winner_id: "p-a" } });
    postgresChangeHandler!({ new: { id: "m1", status: "FINISHED", winner_id: "p-a" } });
    expect(onMatchFinished).toHaveBeenCalledTimes(1);
  });

  it("usa el último onMatchFinished recibido (patrón latest ref)", () => {
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = renderHook(
      ({ cb }) => useMatchFinishListener({ matchId: "m1", onMatchFinished: cb }),
      { initialProps: { cb: first } },
    );
    rerender({ cb: second });
    postgresChangeHandler!({ new: { id: "m1", status: "FINISHED", winner_id: "p-a" } });
    expect(second).toHaveBeenCalledOnce();
    expect(first).not.toHaveBeenCalled();
  });
});
