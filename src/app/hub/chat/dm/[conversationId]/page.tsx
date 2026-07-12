// src/app/hub/chat/dm/[conversationId]/page.tsx - Una conversación privada 1-a-1.
import { notFound } from "next/navigation";
import { HubSectionEntryBurst } from "@/components/hub/sections/HubSectionEntryBurst";
import { DirectConversationClient } from "@/components/hub/community/DirectConversationClient";
import { getDirectConversation } from "@/services/chat/get-dm-conversation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface DirectMessagePageProps {
  params: Promise<{ conversationId: string }>;
}

export default async function DirectMessagePage({ params }: DirectMessagePageProps) {
  const { conversationId } = await params;
  const data = await getDirectConversation(conversationId);
  if (!data) notFound();
  return (
    <main className="hub-control-room-bg relative min-h-dvh w-full text-slate-100">
      <HubSectionEntryBurst />
      <DirectConversationClient
        conversationId={data.conversationId}
        localPlayerId={data.localPlayerId}
        otherNickname={data.otherNickname}
        otherAvatarUrl={data.otherAvatarUrl}
        initialMessages={data.messages}
      />
    </main>
  );
}
