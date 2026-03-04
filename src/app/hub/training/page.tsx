// src/app/page.tsx
import { Board } from "@/components/game/board";

export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-950">
      <Board />
    </main>
  );
}
