/**
 * Tabelas observadas em tempo real pela camada de infraestrutura.
 * São strings opacas para a UI — apenas a implementação Mock conhece
 * o backend real.
 */
export type TabelaRealtime =
  | "services"
  | "staff"
  | "appointments"
  | "blocked_slots"
  | "settings";

export interface IRealtimeService {
  /**
   * Inscreve-se em mudanças. Retorna função de unsubscribe.
   */
  subscribe(tabelas: TabelaRealtime[], onChange: (tabela: TabelaRealtime) => void): () => void;
}
