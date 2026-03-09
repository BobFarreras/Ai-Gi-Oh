// src/core/use-cases/CombatSercice.test.ts - Descripción breve del módulo.
import { describe, it, expect } from 'vitest';
import { CombatService, CombatContext } from './CombatService';

describe('CombatService - Motor de Reglas Core', () => {
  
  it('Ataque Directo: Debería restar los HP del jugador objetivo basados en el ATK', () => {
    const result = CombatService.calculateDirectAttack({ attackerAtk: 2500 });
    
    expect(result.damageToDefenderPlayer).toBe(2500);
    expect(result.attackerDestroyed).toBe(false);
  });

  describe('Combate contra Entidad en Modo ATAQUE', () => {
    it('Atacante gana: Destruye al defensor y hace daño penetrante', () => {
      const ctx: CombatContext = {
        attackerAtk: 2500, // Ej: Gemini 1.5 Pro
        defenderStat: 1500, // Ej: Ollama Local (en modo ataque)
        isDefenderInDefenseMode: false
      };
      const result = CombatService.calculateBattle(ctx);

      expect(result.defenderDestroyed).toBe(true);
      expect(result.attackerDestroyed).toBe(false);
      expect(result.damageToDefenderPlayer).toBe(1000); // 2500 - 1500
      expect(result.damageToAttackerPlayer).toBe(0);
    });

    it('Empate: Ambos son destruidos, sin daño a los jugadores', () => {
      const ctx: CombatContext = { attackerAtk: 2000, defenderStat: 2000, isDefenderInDefenseMode: false };
      const result = CombatService.calculateBattle(ctx);

      expect(result.defenderDestroyed).toBe(true);
      expect(result.attackerDestroyed).toBe(true);
      expect(result.damageToDefenderPlayer).toBe(0);
      expect(result.damageToAttackerPlayer).toBe(0);
    });
  });

  describe('Combate contra Entidad en Modo DEFENSA', () => {
    it('Atacante gana: Destruye al defensor, pero no hace daño a los HP', () => {
      const ctx: CombatContext = {
        attackerAtk: 2500, // Gemini
        defenderStat: 2000, // Defensa
        isDefenderInDefenseMode: true
      };
      const result = CombatService.calculateBattle(ctx);

      expect(result.defenderDestroyed).toBe(true);
      expect(result.attackerDestroyed).toBe(false);
      expect(result.damageToDefenderPlayer).toBe(0); // El escudo absorbe el daño
      expect(result.damageToAttackerPlayer).toBe(0);
    });

    it('Defensor gana (Rebote): Nadie muere, el atacante recibe daño por la diferencia', () => {
      const ctx: CombatContext = {
        attackerAtk: 1500, // Atacante débil
        defenderStat: 2800, // Ej: Ollama Local en modo defensa
        isDefenderInDefenseMode: true
      };
      const result = CombatService.calculateBattle(ctx);

      expect(result.defenderDestroyed).toBe(false);
      expect(result.attackerDestroyed).toBe(false);
      expect(result.damageToDefenderPlayer).toBe(0);
      expect(result.damageToAttackerPlayer).toBe(1300); // 2800 - 1500
    });
  });
});

