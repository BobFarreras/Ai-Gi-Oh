// src/components/hub/market/internal/pack-mosaic-cards.ts - Datos visuales de mosaico para representar sobres en el panel de packs.
import { ICard } from "@/core/entities/ICard";

export const MOSAIC_CARDS: ICard[] = [
  { id: "m1", name: "AI Core", type: "ENTITY", faction: "BIG_TECH", cost: 7, attack: 2500, defense: 2000, description: "" },
  { id: "m2", name: "Logic Bomb", type: "EXECUTION", faction: "NO_CODE", cost: 3, description: "" },
  { id: "m3", name: "Firewall", type: "TRAP", faction: "NEUTRAL", cost: 4, description: "" },
  { id: "m4", name: "Datacenter", type: "ENVIRONMENT", faction: "BIG_TECH", cost: 2, description: "" },
  { id: "m5", name: "Scrap Bot", type: "ENTITY", faction: "OPEN_SOURCE", cost: 1, attack: 500, defense: 1000, description: "" },
  { id: "m6", name: "Trojan", type: "EXECUTION", faction: "OPEN_SOURCE", cost: 5, description: "" },
  { id: "m7", name: "Mainframe", type: "ENTITY", faction: "BIG_TECH", cost: 8, attack: 3000, defense: 3000, description: "" },
  { id: "m8", name: "Bypass", type: "EXECUTION", faction: "OPEN_SOURCE", cost: 2, description: "" },
  { id: "m9", name: "Honeypot", type: "TRAP", faction: "NO_CODE", cost: 3, description: "" },
];

export const MOSAIC_POSITIONS = [
  "-top-[20px] -left-[10px] rotate-[-15deg]",
  "-top-[30px] left-[30px] rotate-[10deg]",
  "-top-[15px] left-[70px] rotate-[25deg]",
  "top-[40px] -left-[20px] rotate-[8deg]",
  "top-[50px] left-[25px] rotate-[-12deg]",
  "top-[35px] left-[75px] rotate-[-20deg]",
  "top-[100px] -left-[5px] rotate-[-18deg]",
  "top-[115px] left-[35px] rotate-[15deg]",
  "top-[85px] left-[85px] rotate-[35deg]",
];
