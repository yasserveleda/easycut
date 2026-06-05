import { supabase } from "@/integrations/supabase/client";
import type { IRealtimeService, TabelaRealtime } from "./IRealtimeService";

export class RealtimeServiceMock implements IRealtimeService {
  subscribe(tabelas: TabelaRealtime[], onChange: (tabela: TabelaRealtime) => void): () => void {
    let channel = supabase.channel(`salon-${Math.random().toString(36).slice(2)}`);
    for (const tabela of tabelas) {
      channel = channel.on(
        "postgres_changes" as never,
        { event: "*", schema: "public", table: tabela },
        () => onChange(tabela),
      );
    }
    channel.subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }
}
