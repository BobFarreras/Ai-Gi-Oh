// src/components/game/board/ui/DuelResultOverlay.test.tsx - Verifica que el overlay de resultado muestre recompensas Story sin romper el resumen de EXP.
import { fireEvent, render, screen } from "@testing-library/react";
import { DuelResultOverlay } from "./DuelResultOverlay";
import { ICard } from "@/core/entities/ICard";
import { IPlayer } from "@/core/entities/IPlayer";

const mockCard: ICard = {
  id: "entity-test",
  name: "Carta Test",
  description: "Carta de prueba.",
  type: "ENTITY",
  faction: "NEUTRAL",
  cost: 2,
  attack: 900,
  defense: 800,
  bgUrl: "/assets/cards/bg/default.webp",
  renderUrl: "/assets/cards/renders/test.png",
};

const mockPlayer: IPlayer = {
  id: "player-a",
  name: "Arquitecto",
  healthPoints: 4000,
  maxHealthPoints: 4000,
  currentEnergy: 3,
  maxEnergy: 3,
  deck: [],
  hand: [],
  graveyard: [],
  activeEntities: [],
  activeExecutions: [],
};

describe("DuelResultOverlay", () => {
  it("muestra recompensas de Story y permite revelar la carta regalo", () => {
    render(
      <DuelResultOverlay
        winnerPlayerId={mockPlayer.id}
        playerA={mockPlayer}
        playerB={{ ...mockPlayer, id: "player-b", name: "Rival" }}
        battleExperienceSummary={[]}
        battleExperienceCardLookup={{}}
        isBattleExperiencePending={false}
        rewardSummary={{ rewardNexus: 120, rewardPlayerExperience: 80, rewardCards: [mockCard] }}
        resultActionLabel="Volver al mapa Story"
        onRestart={() => undefined}
      />,
    );

    expect(screen.getByText("Recompensas")).toBeInTheDocument();
    expect(screen.getByText("+120")).toBeInTheDocument();
    expect(screen.getByText("+80")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /mostrar carta recompensa/i }));
    expect(screen.getByText("Carta obtenida")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Volver al mapa Story" })).toBeInTheDocument();
  });
});
