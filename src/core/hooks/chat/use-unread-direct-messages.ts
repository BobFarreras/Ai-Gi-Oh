// src/core/hooks/chat/use-unread-direct-messages.ts - Total de DM no leídos del jugador, en vivo. Sirve
// para el badge del botón de chat. Carga el total inicial y lo incrementa por realtime cuando llega un
// mensaje privado de OTRO jugador (los propios se ignoran). Al reenfocar la pestaña, refresca.
"use client";

import { useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { createSupabaseBrowserClient } from "@/infrastructure/persistence/supabase/internal/create-supabase-browser-client";
import { fetchUnreadDirectCount } from "@/core/hooks/chat/direct-messages-api";

export function useUnreadDirectMessages(): number {
  const [count, setCount] = useState(0);
  const meRef = useRef<string | null>(null);

  useEffect(() => {
    let isActive = true;
    const supabase = createSupabaseBrowserClient();
    let channel: RealtimeChannel | null = null;

    const refresh = async (): Promise<void> => {
      const total = await fetchUnreadDirectCount();
      if (isActive) setCount(total);
    };

    void (async () => {
      const { data } = await supabase.auth.getUser();
      if (!isActive) return;
      meRef.current = data.user?.id ?? null;
      await refresh();
      // RLS limita los INSERT recibidos a las conversaciones del jugador; solo contamos los ajenos.
      channel = supabase
        .channel("dm-unread")
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "dm_messages" }, (payload) => {
          const senderId = (payload.new as { sender_id?: string })?.sender_id;
          if (senderId && senderId !== meRef.current) setCount((current) => current + 1);
        })
        .subscribe();
    })();

    // Al volver a la pestaña (p.ej. tras leer una conversación en otra vista), se resincroniza.
    const onVisible = (): void => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      isActive = false;
      document.removeEventListener("visibilitychange", onVisible);
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  return count;
}
