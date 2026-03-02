// src/components/game/board/Board.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Board } from './index';
import * as useBoardModule from './hooks/useBoard';
import { IPlayer } from '@/core/entities/IPlayer';
import { ICard } from '@/core/entities/ICard';
import { GameState } from '@/core/use-cases/GameEngine';

// Hacemos un Mock (simulación) del archivo entero del hook
vi.mock('./hooks/useBoard', () => ({
  useBoard: vi.fn(),
}));

describe('Componente UI: Board y Subcomponentes', () => {
  const mockEntity: ICard = {
    id: 'c1', name: 'Hack Script', description: 'Ataca fuerte', type: 'ENTITY', faction: 'OPEN_SOURCE', cost: 2, attack: 1500, defense: 1000
  };

  // Mocks actualizados con todas las propiedades de IPlayer
  const mockPlayer: IPlayer = {
    id: 'p1', name: 'Boby Master', healthPoints: 4000, maxHealthPoints: 4000, currentEnergy: 5, maxEnergy: 10, 
    deck: [], hand: [mockEntity], graveyard: [], activeEntities: [], activeExecutions: []
  };
  
  const mockOpponent: IPlayer = {
    id: 'p2', name: 'AI Overlord', healthPoints: 3500, maxHealthPoints: 4000, currentEnergy: 8, maxEnergy: 10, 
    deck: [], hand: [], graveyard: [], activeEntities: [], activeExecutions: []
  };

  const mockGameState: GameState = {
    playerA: mockPlayer,
    playerB: mockOpponent,
    activePlayerId: 'p1',
    startingPlayerId: 'p1',
    turn: 1,
    phase: 'MAIN_1',
    hasNormalSummonedThisTurn: false,
    pendingTurnAction: null,
  };

  beforeEach(() => {
    // Antes de cada test, le decimos al Hook falso qué debe devolver
    vi.mocked(useBoardModule.useBoard).mockReturnValue({
      gameState: mockGameState,
      selectedCard: null,
      playingCard: null,
      isHistoryOpen: false,
      activeAttackerId: null,
      revealedEntities: [],
      lastError: null,
      pendingEntityReplacement: null,
      pendingActionHint: null,
      pendingDiscardCardIds: [],
      pendingEntitySelectionIds: [],
      opponentDifficulty: "EASY",
      isPlayerTurn: true,
      resolvePendingTurnAction: vi.fn(),
      resolvePendingHandDiscard: vi.fn(),
      setIsHistoryOpen: vi.fn(),
      toggleCardSelection: vi.fn(),
      clearSelection: vi.fn(),
      clearError: vi.fn(),
      executePlayAction: vi.fn(),
      handleEntityClick: vi.fn(),
      advancePhase: vi.fn(),
    });
  });

  it('debería renderizar la información de los jugadores correctamente en el HUD', () => {
    render(<Board />); // Ya no pasamos props, el Board usa el hook internamente

    expect(screen.getByText('Boby Master')).toBeInTheDocument();
    expect(screen.getByText('AI Overlord')).toBeInTheDocument();
    expect(screen.getByText(/dificultad easy/i)).toBeInTheDocument();
  });

  it('debería abrir el historial de batalla al hacer click en el botón de historial', () => {
    // Simulamos que isHistoryOpen es falso inicialmente, pero pasamos la función para abrir
    const setIsHistoryOpenMock = vi.fn();
    vi.mocked(useBoardModule.useBoard).mockReturnValue({
      ...vi.mocked(useBoardModule.useBoard)(),
      isHistoryOpen: false,
      setIsHistoryOpen: setIsHistoryOpenMock
    });

    render(<Board />);

    // Hacemos click en el botón de historial usando su nombre accesible
    const historyBtn = screen.getByRole('button', { name: /abrir historial de batalla/i });
    fireEvent.click(historyBtn);

    // Verificamos que se haya llamado a la función del hook para abrirlo
    expect(setIsHistoryOpenMock).toHaveBeenCalledWith(true);
  });

  it('no debería mostrar acciones de fase cuando es turno del rival', () => {
    vi.mocked(useBoardModule.useBoard).mockReturnValue({
      ...vi.mocked(useBoardModule.useBoard)(),
      isPlayerTurn: false,
    });

    render(<Board />);

    expect(screen.queryByText(/ir a combate/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/pasar turno/i)).not.toBeInTheDocument();
    expect(screen.getByText(/turno rival/i)).toBeInTheDocument();
  });
});
