import type { IRealtimeService, TabelaRealtime } from "./IRealtimeService";

export class RealtimeServiceHttp implements IRealtimeService {
  subscribe(_tabelas: TabelaRealtime[], _onChange: (tabela: TabelaRealtime) => void): () => void {
    // O BFF futuramente pode expor WebSocket/SSE. Por ora, nada.
    return () => {};
  }
}
