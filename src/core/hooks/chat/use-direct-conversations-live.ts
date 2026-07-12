// src/core/hooks/chat/use-direct-conversations-live.ts - Lista de conversaciones privadas en vivo: parte de
// la carga inicial (server) y la recarga por realtime al insertarse cualquier mensaje privado (no-leídos,
// extracto y orden) y al reenfocar la pestaña.
"use client";

import { useEffect, useRef, useState } from "react";
import { IDirectConversation } from "@/core/entities/chat/IDirectMessage";
import { createSupabaseBrowserClient } from "@/infrastructure/persistence/supabase/internal/create-supabase-browser-client";
import { fetchDirectConversations } from "@/core/hooks/chat/direct-messages-api";

export function useDirectConversationsLive(initial: IDirectConversation[]): IDirectConversation[] {
  const [conversations, setConversations] = useState<IDirectConversation[]>(initial);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    let isActive = true;
    const supabase = createSupabaseBrowserClient();

    const refresh = (): void => {
      // Debounce ligero para agrupar ráfagas de inserts.
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => {
        void fetchDirectConversations()
          .then((next) => {
            if (isActive) setConversations(next);
          })
          .catch(() => undefined);
      }, 250);
    };

    const channel = supabase
      .channel("dm-inbox")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "dm_messages" }, refresh)
      .subscribe();

    const onVisible = (): void => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      isActive = false;
      if (timerRef.current) window.clearTimeout(timerRef.current);
      document.removeEventListener("visibilitychange", onVisible);
      supabase.removeChannel(channel);
    };
  }, []);

  return conversations;
}
