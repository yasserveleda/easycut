/**
 * Contrato de persistência local.
 *
 * Pequena camada de infraestrutura que abstrai onde os dados ficam guardados.
 * As implementações de Service consomem essa interface — nunca tocam diretamente
 * em `localStorage` ou em qualquer SDK de backend. Isso permite trocar a
 * persistência (LocalStorage → IndexedDB → BFF HTTP) sem alterar telas.
 */
export interface StorageService {
  get<T>(key: string): T | null;
  set<T>(key: string, value: T): void;
  remove(key: string): void;
}
