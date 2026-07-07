// src/components/hub/story/overworld/hud/resolve-intent-presentation.ts - Textos de UI por tipo de objeto del overworld (verbo de acción y panel).
import { OverworldObjectKind } from "@/services/story/overworld/tilemap-schema";

export interface IIntentPresentation {
  /** Verbo corto para el prompt contextual. */
  actionVerb: string;
  /** Título del panel de interacción. */
  title: string;
  /** Descripción de qué hará la interacción (marca lo que aún es de fases posteriores). */
  body: string;
}

const PRESENTATIONS: Record<OverworldObjectKind, IIntentPresentation> = {
  DUEL: {
    actionVerb: "Entrar al duelo",
    title: "Rival de historia",
    body: "Iniciará el duelo Story contra este oponente (reutiliza el flujo de duelo existente).",
  },
  BOSS: {
    actionVerb: "Retar al jefe",
    title: "Jefe de acto",
    body: "Iniciará el combate de jefe. La cámara cinemática se conecta en la fase de pulido.",
  },
  REWARD_CARD: {
    actionVerb: "Recoger carta",
    title: "Recompensa de carta",
    body: "Añadirá la carta a tu colección con su animación de recolección.",
  },
  REWARD_NEXUS: {
    actionVerb: "Recoger Nexus",
    title: "Cache de Nexus",
    body: "Sumará Nexus a tu cuenta con su animación de recolección.",
  },
  EVENT: {
    actionVerb: "Investigar",
    title: "Evento narrativo",
    body: "Lanzará el diálogo/cinemática de este punto (reutiliza el catálogo de diálogos).",
  },
  NPC: {
    actionVerb: "Hablar",
    title: "Aliado",
    body: "Abrirá la conversación con este personaje.",
  },
  SUBMISSION: {
    actionVerb: "Usar terminal",
    title: "Terminal de sincronización",
    body: "Pedirá el código de submission tras reunir las llaves necesarias.",
  },
  WARP: {
    actionVerb: "Cruzar portal",
    title: "Portal de acto",
    body: "Te llevará al mapa de destino con la secuencia de teletransporte (Fase 3).",
  },
  GATE: {
    actionVerb: "Abrir",
    title: "Puerta bloqueada",
    body: "Se abrirá automáticamente al cumplir sus requisitos.",
  },
};

export function resolveIntentPresentation(kind: OverworldObjectKind): IIntentPresentation {
  return PRESENTATIONS[kind];
}
