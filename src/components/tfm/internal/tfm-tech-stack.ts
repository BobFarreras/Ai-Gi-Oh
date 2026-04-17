// src/components/tfm/internal/tfm-tech-stack.ts - Define stack tecnológico y tooling real mostrado en la presentación TFM.
export interface ITFMStackLogo {
  id: string;
  name: string;
  imagePath: string;
}

export const TFM_STACK_LOGOS: ITFMStackLogo[] = [
  { id: "next", name: "Next.js 16", imagePath: "/assets/renders/nextjs.webp" },
  { id: "react", name: "React 19", imagePath: "/assets/renders/react.webp" },
  { id: "ts", name: "TypeScript", imagePath: "/assets/renders/typescript.webp" },
  { id: "supabase", name: "Supabase", imagePath: "/assets/renders/supabase.webp" },
  { id: "github", name: "GitHub", imagePath: "/assets/renders/github.webp" },
  { id: "vercel", name: "Vercel", imagePath: "/assets/renders/vercel.webp" },
  { id: "git", name: "Git", imagePath: "/assets/renders/git.webp" },
  { id: "docker", name: "Docker", imagePath: "/assets/renders/docker.webp" },
];

export const TFM_STACK_TOOLING: string[] = [
  "pnpm",
  "Vitest",
  "Playwright",
  "Zustand",
  "Framer Motion",
  "Engram (memoria persistente)",
];
