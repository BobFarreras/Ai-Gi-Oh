// src/core/entities/ICard.ts
export type CardType = "ENTITY" | "EXECUTION" | "TRAP" | "FUSION" | "ENVIRONMENT";
export type Faction = 'OPEN_SOURCE' | 'BIG_TECH' | 'NO_CODE' | 'NEUTRAL';

// ESTRUCTURA JSON DINÁMICA PARA EFECTOS
export interface ICardEffect {
  action: 'DAMAGE' | 'HEAL' | 'DRAW_CARD' | 'BOOST_ATK';
  target: 'OPPONENT' | 'PLAYER' | 'ALL_ENTITIES';
  value: number;
}

export interface ICard {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly type: CardType;
  readonly faction: Faction;
  readonly cost: number;       
  readonly attack?: number;    
  readonly defense?: number;   
  readonly bgUrl?: string;     
  readonly renderUrl?: string; 
  
  // NUEVO: El efecto se guarda como un objeto de datos (Fácil para la Base de Datos)
  readonly effect?: ICardEffect; 
  readonly fusionRecipeId?: string;
  readonly fusionMaterials?: string[];
  readonly fusionEnergyRequirement?: number;
  readonly archetype?: string;
}
