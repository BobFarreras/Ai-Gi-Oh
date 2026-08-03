// src/components/hub/academy/training/modes/survival/internal/SurvivalLobby.test.tsx - Verifica estado, accesibilidad y continuación de la expedición.
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SurvivalLobby } from "./SurvivalLobby";

describe("SurvivalLobby", () => {
  it("muestra los LP transportados y permite continuar con un control accesible", () => {
    const onStart = vi.fn();
    render(<SurvivalLobby
      run={{
        id: "run-1", playerId: "p1", status: "ACTIVE", currentLp: 4300, maxLp: 8000,
        wins: 3, currentBattleIndex: 3, rulesetVersion: 1, startedAtIso: "2026-07-30",
        completedAtIso: null, version: 1,
      }}
      progress={{ bestWins: 7, ascensionFragments: 120 }}
      battleIndex={4}
      milestoneInterval={5}
      milestoneHeal={2000}
      effectiveTier={5}
      ascensionRank={0}
      aiProfile="HARD"
      isResumed={false}
      opponentName="Helena"
      opponentAvatarUrl="/helena.webp"
      error={null}
      notice={null}
      onStart={onStart}
      onBack={vi.fn()}
    />);

    // Los LP viven en la barra de vitales, que es la lectura principal del modo.
    expect(screen.getByText("4300")).toBeInTheDocument();
    expect(screen.getByText("/ 8000")).toBeInTheDocument();
    // Las cifras secundarias salen dos veces: rejilla de escritorio y desplegable móvil.
    expect(screen.getAllByText("120").length).toBeGreaterThan(0);
    expect(screen.getByText("Combate 4")).toBeInTheDocument();
    expect(screen.getByText("Helena")).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("button", { name: "Empezar Combate" })[0]);
    expect(onStart).toHaveBeenCalledOnce();
  });

  it("pliega las cifras secundarias en móvil para no comerse la pantalla con el header", () => {
    render(<SurvivalLobby
      run={{
        id: "run-1", playerId: "p1", status: "ACTIVE", currentLp: 4300, maxLp: 8000,
        wins: 3, currentBattleIndex: 3, rulesetVersion: 1, startedAtIso: "2026-07-30",
        completedAtIso: null, version: 1,
      }}
      progress={{ bestWins: 7, ascensionFragments: 120 }}
      battleIndex={4}
      milestoneInterval={5}
      milestoneHeal={2000}
      effectiveTier={5}
      ascensionRank={0}
      aiProfile="HARD"
      isResumed={false}
      opponentName="Helena"
      opponentAvatarUrl="/helena.webp"
      error={null}
      notice={null}
      onStart={vi.fn()}
      onBack={vi.fn()}
    />);

    // Las cifras son icono + valor dentro de la cabecera: sin desplegable ni rótulos que gasten líneas.
    expect(screen.getByLabelText("Victorias de esta expedición: 3")).toBeInTheDocument();
    expect(screen.getByLabelText("Récord personal: 7")).toBeInTheDocument();
    expect(screen.getByLabelText("Éter acumulado: 120")).toBeInTheDocument();
    // El texto que explicaba el arrastre de LP desaparece: lo cuenta el medidor.
    expect(screen.queryByText(/LP iniciales del siguiente combate/i)).not.toBeInTheDocument();
  });

  it("muestra la dificultad real del encuentro, incluida la vuelta de Ascensión", () => {
    render(<SurvivalLobby
      run={{
        id: "run-1", playerId: "p1", status: "ACTIVE", currentLp: 5000, maxLp: 8000,
        wins: 12, currentBattleIndex: 12, rulesetVersion: 1, startedAtIso: "2026-07-30",
        completedAtIso: null, version: 1,
      }}
      progress={{ bestWins: 12, ascensionFragments: 300 }}
      battleIndex={13}
      milestoneInterval={5}
      milestoneHeal={2000}
      effectiveTier={8}
      ascensionRank={2}
      aiProfile="MYTHIC"
      isResumed={false}
      opponentName="Gokernel"
      opponentAvatarUrl="/gokernel.webp"
      error={null}
      notice={null}
      onStart={vi.fn()}
      onBack={vi.fn()}
    />);

    expect(screen.getByLabelText(/Dificultad del rival · IA MYTHIC: T8 · Asc ×2/)).toBeInTheDocument();
  });

  it("calcula la próxima curación con el intervalo del ruleset, no con uno fijo", () => {
    render(<SurvivalLobby
      run={{
        id: "run-1", playerId: "p1", status: "ACTIVE", currentLp: 6000, maxLp: 8000,
        wins: 4, currentBattleIndex: 4, rulesetVersion: 2, startedAtIso: "2026-07-31",
        completedAtIso: null, version: 1,
      }}
      progress={{ bestWins: 4, ascensionFragments: 60 }}
      battleIndex={5}
      milestoneInterval={3}
      milestoneHeal={2000}
      effectiveTier={5}
      ascensionRank={0}
      aiProfile="HARD"
      isResumed={false}
      opponentName="Jaku"
      opponentAvatarUrl="/jaku.webp"
      error={null}
      notice={null}
      onStart={vi.fn()}
      onBack={vi.fn()}
    />);

    // Con intervalo 3 y 4 victorias van 1 de 3 en el ciclo: quedan 2 para curar, no 1 como daría un 5 fijo.
    expect(screen.getByLabelText("1 de 3 victorias hacia la curación de 2000 LP")).toBeInTheDocument();
  });

  it("avisa de que la expedición anterior se cerró por abandono", () => {
    render(<SurvivalLobby
      run={{
        id: "run-2", playerId: "p1", status: "ACTIVE", currentLp: 8000, maxLp: 8000,
        wins: 0, currentBattleIndex: 1, rulesetVersion: 1, startedAtIso: "2026-07-31",
        completedAtIso: null, version: 1,
      }}
      progress={{ bestWins: 7, ascensionFragments: 120 }}
      battleIndex={1}
      milestoneInterval={5}
      milestoneHeal={2000}
      effectiveTier={5}
      ascensionRank={0}
      aiProfile="HARD"
      isResumed={false}
      opponentName="GenNvim"
      opponentAvatarUrl="/gennvim.webp"
      error={null}
      notice="Tu expedición anterior se cerró como derrota: dejaste un combate sin terminar."
      onStart={vi.fn()}
      onBack={vi.fn()}
    />);

    expect(screen.getByRole("status")).toHaveTextContent("se cerró como derrota");
  });

  it("identifica una sesión pendiente como reanudación del mismo combate", () => {
    render(<SurvivalLobby
      run={{
        id: "run-1", playerId: "p1", status: "ACTIVE", currentLp: 8000, maxLp: 8000,
        wins: 0, currentBattleIndex: 1, rulesetVersion: 1, startedAtIso: "2026-07-30",
        completedAtIso: null, version: 1,
      }}
      progress={{ bestWins: 0, ascensionFragments: 0 }}
      battleIndex={1}
      milestoneInterval={5}
      milestoneHeal={2000}
      effectiveTier={4}
      ascensionRank={0}
      aiProfile="HARD"
      isResumed
      opponentName="GenNvim"
      opponentAvatarUrl="/gennvim.webp"
      error={null}
      notice={null}
      onStart={vi.fn()}
      onBack={vi.fn()}
    />);

    expect(screen.getByText("Combate 1")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Reanudar Combate" })).not.toHaveLength(0);
  });
});
