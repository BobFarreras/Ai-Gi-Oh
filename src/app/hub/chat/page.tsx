// src/app/hub/chat/page.tsx - Página del chat/foro de comunidad del hub.
import { redirect } from "next/navigation";
import { HubSectionEntryBurst } from "@/components/hub/sections/HubSectionEntryBurst";
import { CommunityChatClient } from "@/components/hub/community/CommunityChatClient";
import { getMultiplayerLobbyData } from "@/services/multiplayer/get-multiplayer-lobby-data";
import { getCurrentUserSession } from "@/services/auth/get-current-user-session";
import { getRecentChatMessages } from "@/services/chat/get-recent-chat-messages";

const CHAT_ROOM = "lobby";

export default async function HubChatPage() {
  const session = await getCurrentUserSession();
  if (!session?.user.id) redirect("/login");
  const lobbyData = await getMultiplayerLobbyData();
  if (!lobbyData) redirect("/login");

  // Carga inicial server-side (LCP): el cliente sigue en vivo desde aquí vía realtime.
  const initialMessages = await getRecentChatMessages(CHAT_ROOM);

  return (
    <main className="hub-control-room-bg relative min-h-dvh w-full text-slate-100">
      <HubSectionEntryBurst />
      <CommunityChatClient
        room={CHAT_ROOM}
        localPlayerId={lobbyData.playerId}
        localNickname={lobbyData.nickname}
        initialMessages={initialMessages}
      />
    </main>
  );
}
