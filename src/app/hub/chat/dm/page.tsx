// src/app/hub/chat/dm/page.tsx - Bandeja de conversaciones privadas 1-a-1.
import { redirect } from "next/navigation";
import { HubSectionEntryBurst } from "@/components/hub/sections/HubSectionEntryBurst";
import { DirectConversationsClient } from "@/components/hub/community/DirectConversationsClient";
import { getDirectConversations } from "@/services/chat/get-dm-conversations";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DirectMessagesInboxPage() {
  const { conversations, localPlayerId } = await getDirectConversations();
  if (!localPlayerId) redirect("/login");
  return (
    <main className="hub-control-room-bg relative min-h-dvh w-full text-slate-100">
      <HubSectionEntryBurst />
      <DirectConversationsClient conversations={conversations} />
    </main>
  );
}
