import { CardArchetype, ICard } from "@/core/entities/ICard";

interface EntitySeed {
  id: string;
  name: string;
  renderFile: string;
  cost: number;
  faction: ICard["faction"];
  archetype: CardArchetype;
  description: string;
}

function statsByCost(cost: number): Pick<ICard, "attack" | "defense"> {
  if (cost <= 2) return { attack: 800, defense: 1000 };
  if (cost === 3) return { attack: 1200, defense: 1100 };
  if (cost === 4) return { attack: 1500, defense: 1100 };
  if (cost === 5) return { attack: 1850, defense: 1250 };
  if (cost === 6) return { attack: 2200, defense: 1400 };
  return { attack: 2500, defense: 1700 };
}

function createEntity(seed: EntitySeed): ICard {
  return {
    id: seed.id,
    name: seed.name,
    description: seed.description,
    type: "ENTITY",
    faction: seed.faction,
    cost: seed.cost,
    archetype: seed.archetype,
    ...statsByCost(seed.cost),
    bgUrl: "/assets/bgs/bg-tech.jpg",
    renderUrl: `/assets/renders/${seed.renderFile}.png`,
  };
}

export const ENTITY_CARDS: ICard[] = [
  createEntity({ id: "entity-ollama", name: "Ollama", renderFile: "ollama", cost: 3, faction: "OPEN_SOURCE", archetype: "LLM", description: "Modelo local de respuesta estable." }),
  createEntity({ id: "entity-python", name: "Python", renderFile: "python", cost: 3, faction: "OPEN_SOURCE", archetype: "LANGUAGE", description: "Lenguaje flexible para combos de scripts." }),
  createEntity({ id: "entity-react", name: "React", renderFile: "react", cost: 4, faction: "BIG_TECH", archetype: "FRAMEWORK", description: "Framework de interfaz con presión constante." }),
  createEntity({ id: "entity-postgress", name: "Postgress", renderFile: "postgress", cost: 4, faction: "OPEN_SOURCE", archetype: "DB", description: "Base de datos robusta con defensa sólida." }),
  createEntity({ id: "entity-supabase", name: "Supabase", renderFile: "supabase", cost: 4, faction: "OPEN_SOURCE", archetype: "DB", description: "Backend rápido para control de recursos." }),
  createEntity({ id: "entity-huggenface", name: "HuggenFace", renderFile: "huggenface", cost: 3, faction: "OPEN_SOURCE", archetype: "LLM", description: "Hub de modelos con soporte de equipo." }),
  createEntity({ id: "entity-perplexity", name: "Perplexity", renderFile: "perplexity", cost: 3, faction: "NO_CODE", archetype: "TOOL", description: "Búsqueda ágil para responder amenazas." }),
  createEntity({ id: "entity-kali-linux", name: "Kali Linux", renderFile: "kali-linux", cost: 5, faction: "OPEN_SOURCE", archetype: "SECURITY", description: "Especialista ofensivo de alto impacto." }),
  createEntity({ id: "entity-astro", name: "Astro", renderFile: "astro", cost: 3, faction: "OPEN_SOURCE", archetype: "FRAMEWORK", description: "Render eficiente de ataque táctico." }),
  createEntity({ id: "entity-deepseek", name: "DeepSeek", renderFile: "deepseek", cost: 4, faction: "OPEN_SOURCE", archetype: "LLM", description: "Modelo analítico para duelos largos." }),
  createEntity({ id: "entity-vscode", name: "VSCode", renderFile: "vscode", cost: 2, faction: "BIG_TECH", archetype: "IDE", description: "IDE versátil para desplegar cartas rápido." }),
  createEntity({ id: "entity-cursor", name: "Cursor", renderFile: "cursor", cost: 2, faction: "NO_CODE", archetype: "IDE", description: "Asistencia inteligente de ejecución rápida." }),
  createEntity({ id: "entity-nextjs", name: "Next.js", renderFile: "nextjs", cost: 4, faction: "BIG_TECH", archetype: "FRAMEWORK", description: "Framework full-stack de presión media." }),
  createEntity({ id: "entity-claude", name: "Claude", renderFile: "claude", cost: 4, faction: "NO_CODE", archetype: "LLM", description: "Modelo estratégico con control defensivo." }),
  createEntity({ id: "entity-git", name: "Git", renderFile: "git", cost: 2, faction: "OPEN_SOURCE", archetype: "TOOL", description: "Control de versión para jugar seguro." }),
  createEntity({ id: "entity-github", name: "GitHub", renderFile: "github", cost: 3, faction: "BIG_TECH", archetype: "TOOL", description: "Repositorio global con soporte táctico." }),
  createEntity({ id: "entity-chatgpt", name: "ChatGPT", renderFile: "chatgpt", cost: 5, faction: "BIG_TECH", archetype: "LLM", description: "Modelo multimodal para cierre de duelo." }),
  createEntity({ id: "entity-gemini", name: "Gemini", renderFile: "gemini", cost: 5, faction: "BIG_TECH", archetype: "LLM", description: "Entidad de alto nivel para sinergias LLM." }),
  createEntity({ id: "entity-vercel", name: "Vercel", renderFile: "vercel", cost: 3, faction: "BIG_TECH", archetype: "FRAMEWORK", description: "Plataforma de despliegue con tempo agresivo." }),
  createEntity({ id: "entity-openclaw", name: "OpenClaw", renderFile: "openclaw", cost: 4, faction: "OPEN_SOURCE", archetype: "TOOL", description: "Agente autónomo con presión de mesa." }),
  createEntity({ id: "entity-n8n", name: "n8n", renderFile: "n8n", cost: 3, faction: "OPEN_SOURCE", archetype: "TOOL", description: "Automatización de flujos para ganar ventaja." }),
  createEntity({ id: "entity-make", name: "Make", renderFile: "make", cost: 3, faction: "NO_CODE", archetype: "TOOL", description: "Orquestador visual de alto valor táctico." }),
];
