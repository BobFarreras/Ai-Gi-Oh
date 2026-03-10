// src/components/game/board/hooks/internal/sleep.ts - Descripción breve del módulo.
export const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

