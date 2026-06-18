// src/app/hub/multiplayer/page.tsx - Lobby multijugador: presencia online, invitaciones y acceso a partidas.
import { redirect } from "next/navigation";
import { MultiplayerScene } from "@/components/hub/multiplayer/MultiplayerScene";
import { MultiplayerLobby } from "@/components/hub/multiplayer/MultiplayerLobby";
import { getMultiplayerLobbyData } from "@/services/multiplayer/get-multiplayer-lobby-data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function MultiplayerPage() {
  const lobbyData = await getMultiplayerLobbyData();

  if (!lobbyData) {
    redirect("/login");
  }

  return (
    <MultiplayerScene>
      <MultiplayerLobby
        localPlayerId={lobbyData.playerId}
        localNickname={lobbyData.nickname}
        activeDeckIds={lobbyData.activeDeckIds}
      />
    </MultiplayerScene>
  );
}
