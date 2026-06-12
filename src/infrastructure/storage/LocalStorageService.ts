import type { StorageService } from "./StorageService";

/**
 * Implementação de StorageService baseada em `window.localStorage`,
 * com pub/sub interno para que a camada de Realtime consiga notificar
 * mudanças aos consumidores (store reativa) sem backend.
 *
 * Em SSR (`window` indefinido) o serviço degrada para um Map em memória
 * apenas para não quebrar o build; nenhum dado é persistido nesse caso.
 */
type Listener = (key: string) => void;

const memoryFallback = new Map<string, string>();

export class LocalStorageService implements StorageService {
  private listeners = new Set<Listener>();

  private get storage(): Storage | null {
    if (typeof window === "undefined") return null;
    try {
      return window.localStorage;
    } catch {
      return null;
    }
  }

  get<T>(key: string): T | null {
    const raw = this.storage ? this.storage.getItem(key) : memoryFallback.get(key) ?? null;
    if (raw === null || raw === undefined) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  set<T>(key: string, value: T): void {
    const raw = JSON.stringify(value);
    if (this.storage) this.storage.setItem(key, raw);
    else memoryFallback.set(key, raw);
    this.emit(key);
  }

  remove(key: string): void {
    if (this.storage) this.storage.removeItem(key);
    else memoryFallback.delete(key);
    this.emit(key);
  }

  /** Observa mutações para que a camada de realtime atualize a UI. */
  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit(key: string) {
    this.listeners.forEach((l) => l(key));
  }
}

/** Instância única reutilizada por todos os serviços locais. */
export const localStorageService = new LocalStorageService();

/** Chaves de persistência por domínio. */
export const STORAGE_KEYS = {
  servicos: "SERVICOS_STORAGE",
  profissionais: "PROFISSIONAIS_STORAGE",
  agendamentos: "AGENDAMENTOS_STORAGE",
  bloqueios: "BLOQUEIOS_STORAGE",
  configuracao: "CONFIGURACAO_STORAGE",
  usuarios: "USUARIOS_STORAGE",
  sessao: "SESSAO_STORAGE",
  seedAplicado: "SEED_APLICADO",
} as const;
