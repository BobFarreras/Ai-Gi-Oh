// src/core/use-cases/GameEngine.test.ts
import { describe, it, expect } from 'vitest';
import { GameEngine, GameState } from './GameEngine';
import { IBoardEntity } from '../entities/IPlayer';
import { ICard } from '../entities/ICard';

const mockCardA: ICard = { id: 'c1', name: 'Gemini', type: 'ENTITY', faction: 'BIG_TECH', cost: 3, attack: 2500, defense: 2000, description: '' };
const mockCardB: ICard = { id: 'c2', name: 'Ollama', type: 'ENTITY', faction: 'OPEN_SOURCE', cost: 2, attack: 1500, defense: 2800, description: '' };

const mockBoardEntityB: IBoardEntity = {
  instanceId: 'inst-c2',
  card: mockCardB,
  mode: 'ATTACK',
  hasAttackedThisTurn: false,
  isNewlySummoned: false
};

const createInitialState = (): GameState => ({
  playerA: {
    id: 'p1', name: 'Neo', healthPoints: 8000, maxHealthPoints: 8000, currentEnergy: 5, maxEnergy: 10,
    deck: [], hand: [mockCardA], graveyard: [], activeEntities: [], activeExecutions: []
  },
  playerB: {
    id: 'p2', name: 'Agent', healthPoints: 8000, maxHealthPoints: 8000, currentEnergy: 5, maxEnergy: 10,
    deck: [], hand: [], graveyard: [], activeEntities: [mockBoardEntityB], activeExecutions: []
  },
  activePlayerId: 'p1',
  startingPlayerId: 'p2',
  turn: 2,
  phase: 'MAIN_1',
  hasNormalSummonedThisTurn: false,
  combatLog: []
});

describe('GameEngine', () => {
  it('Debe jugar una carta de la mano al campo consumiendo energía', () => {
    const initialState = createInitialState();
    
    const newState = GameEngine.playCard(initialState, 'p1', 'c1', 'ATTACK');
    
    expect(newState.playerA.currentEnergy).toBe(2); 
    expect(newState.playerA.hand.length).toBe(0);
    expect(newState.playerA.activeEntities.length).toBe(1);
    expect(newState.playerA.activeEntities[0].card.id).toBe('c1');
    expect(newState.playerA.activeEntities[0].mode).toBe('ATTACK');
    expect(newState.hasNormalSummonedThisTurn).toBe(true);
  });

  it('Debe ejecutar un ataque y aplicar las consecuencias de destrucción', () => {
    let state = createInitialState();
    
    // Neo juega a Gemini
    state = GameEngine.playCard(state, 'p1', 'c1', 'ATTACK');
    
    const geminiInstanceId = state.playerA.activeEntities[0].instanceId;
    
    // CORRECCIÓN AL ERROR TS2540 (READONLY MUTATION):
    // Reconstruimos el estado de manera inmutable en vez de reasignarlo
    state = {
      ...state,
      phase: 'BATTLE',
      playerA: {
        ...state.playerA,
        activeEntities: [
          { ...state.playerA.activeEntities[0], isNewlySummoned: false }
        ]
      }
    };

    state = GameEngine.executeAttack(state, 'p1', geminiInstanceId, 'inst-c2');
    
    // Ollama es destruido y Neo hace 1000 de daño
    expect(state.playerB.healthPoints).toBe(7000); 
    expect(state.playerB.activeEntities.length).toBe(0);
    expect(state.playerB.graveyard[0]?.id).toBe('c2');
    
    // Gemini sobrevive y se marca que ya atacó
    expect(state.playerA.activeEntities.length).toBe(1);
    expect(state.playerA.activeEntities[0].hasAttackedThisTurn).toBe(true);
    expect(state.playerA.healthPoints).toBe(8000);
  });
});
