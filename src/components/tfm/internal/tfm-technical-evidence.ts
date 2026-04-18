// src/components/tfm/internal/tfm-technical-evidence.ts - Resume pilares técnicos del TFM para defensa visual y concisa.
export interface ITFMTechnicalEvidenceBlock {
  id: string;
  title: string;
  summary: string;
  bullets: string[];
}

export const TFM_TECHNICAL_EVIDENCE_BLOCKS: ITFMTechnicalEvidenceBlock[] = [
  {
    id: "arquitectura",
    title: "Arquitectura Clean + Repository Pattern",
    summary: "Separación por capas para escalar sin mezclar UI, reglas de juego y persistencia.",
    bullets: [
      "Flujo: components -> services/use-cases -> core -> infrastructure.",
      "Reglas de dominio fuera de React.",
      "Dashboard admin para editar y añadir contenido sin tocar código del gameplay.",
    ],
  },
  {
    id: "engram",
    title: "Memoria persistente con Engram",
    summary: "Uso de memoria de decisiones para mantener continuidad entre sesiones largas de desarrollo.",
    bullets: [
      "Búsqueda de contexto antes de cambios grandes.",
      "Guardado de hitos técnicos y decisiones.",
      "Resumen de sesión para trazabilidad.",
    ],
  },
  {
    id: "seguridad",
    title: "Seguridad aplicada en APIs",
    summary: "Hardening real en autenticación y rutas críticas para reducir superficie de ataque.",
    bullets: [
      "Validación Origin/Host.",
      "Rate limit por IP/email y modo estricto por entorno.",
      "RPC atómicas para wallet y recompensas.",
    ],
  },
  {
    id: "calidad",
    title: "Calidad: TDD, SOLID y quality gates",
    summary: "Desarrollo guiado por pruebas y reglas de mantenibilidad para evitar deuda técnica.",
    bullets: [
      "Red-Green-Refactor en lógica crítica.",
      "SRP estricto y módulos pequeños.",
      "CI con lint, typecheck, coverage, audit y build.",
    ],
  },
];
