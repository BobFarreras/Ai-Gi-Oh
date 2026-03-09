// src/components/game/board/hooks/useBoard.test.ts - Descripción breve del módulo.
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useBoard } from './useBoard';
import { ICard } from '@/core/entities/ICard';

// 1. Preparamos un Mock de una Carta Cyberpunk
const mockCard: ICard = {
  id: 'card-001',
  name: 'Cyber Dragon Core',
  description: 'Unidad de infiltración de la facción Big Tech.',
  type: 'ENTITY',
  faction: 'BIG_TECH',
  cost: 3,
  attack: 1500,
  defense: 1000,
  bgUrl: 'none',
};

const mockEvent = {
  stopPropagation: vi.fn(),
} as unknown as React.MouseEvent;

describe('useBoard Custom Hook', () => {
  it('Debe inicializar con los estados limpios (null/false)', () => {
    const { result } = renderHook(() => useBoard());
    
    expect(result.current.selectedCard).toBeNull();
    expect(result.current.playingCard).toBeNull();
    expect(result.current.isHistoryOpen).toBe(false);
  });

  it('Debe seleccionar una carta y prepararla para jugar', () => {
    const { result } = renderHook(() => useBoard());
    
    act(() => {
      result.current.toggleCardSelection(mockCard, mockEvent);
    });
    
    expect(mockEvent.stopPropagation).toHaveBeenCalled();
    expect(result.current.selectedCard).toEqual(mockCard);
    expect(result.current.playingCard).toEqual(mockCard);
  });

  it('Debe deseleccionar la carta si se hace clic en ella dos veces (Toggle)', () => {
    const { result } = renderHook(() => useBoard());
    
    act(() => {
      // Primer clic: Selecciona
      result.current.toggleCardSelection(mockCard, mockEvent);
    });
    act(() => {
      // Segundo clic: Deselecciona
      result.current.toggleCardSelection(mockCard, mockEvent);
    });
    
    expect(result.current.selectedCard).toBeNull();
    expect(result.current.playingCard).toBeNull();
  });

  it('La función clearSelection debe purgar selección sin cerrar historial', () => {
    const { result } = renderHook(() => useBoard());
    
    // Ensuciamos el estado
    act(() => {
      result.current.toggleCardSelection(mockCard, mockEvent);
      result.current.setIsHistoryOpen(true);
    });
    
    // Ejecutamos la purga
    act(() => {
      result.current.clearSelection();
    });

    expect(result.current.selectedCard).toBeNull();
    expect(result.current.playingCard).toBeNull();
    expect(result.current.isHistoryOpen).toBe(true);
  });

  it('Debe exponer un error tipado cuando se intenta una acción inválida', async () => {
    const { result } = renderHook(() => useBoard());
    const handCard = result.current.gameState.playerA.hand[0];

    expect(handCard).toBeDefined();
    if (!handCard) {
      throw new Error('La mano inicial no puede estar vacía en este escenario.');
    }
    const invalidMode = handCard.type === 'ENTITY' ? 'ACTIVATE' : 'ATTACK';

    act(() => {
      result.current.toggleCardSelection(handCard, mockEvent);
    });

    await act(async () => {
      await result.current.executePlayAction(invalidMode, mockEvent);
    });

    expect(result.current.lastError).not.toBeNull();
    expect(result.current.lastError?.code).toBe('VALIDATION_ERROR');
    expect(typeof result.current.lastError?.message).toBe('string');
  });
});

