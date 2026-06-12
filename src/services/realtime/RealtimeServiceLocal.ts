import { localStorageService, STORAGE_KEYS } from "@/infrastructure/storage/LocalStorageService";
import type { IRealtimeService, TabelaRealtime } from "./IRealtimeService";

const KEY_TO_TABLE: Record<string, TabelaRealtime> = {
  [STORAGE_KEYS.servicos]: "services",
  [STORAGE_KEYS.profissionais]: "staff",
  [STORAGE_KEYS.agendamentos]: "appointments",
  [STORAGE_KEYS.bloqueios]: "blocked_slots",
  [STORAGE_KEYS.configuracao]: "settings",
};

/**
 * Realtime "offline": ouve mutações do LocalStorageService no mesmo tab
 * e o evento `storage` do browser para sincronia entre abas.
 */
export class RealtimeServiceLocal implements IRealtimeService {
  subscribe(tabelas: TabelaRealtime[], onChange: (tabela: TabelaRealtime) => void): () => void {
    const interessadas = new Set(tabelas);

    const fromKey = (key: string) => {
      const tabela = KEY_TO_TABLE[key];
      if (tabela && interessadas.has(tabela)) onChange(tabela);
    };

    const unsubLocal = localStorageService.subscribe(fromKey);

    const onStorage = (e: StorageEvent) => {
      if (e.key) fromKey(e.key);
    };
    if (typeof window !== "undefined") {
      window.addEventListener("storage", onStorage);
    }

    return () => {
      unsubLocal();
      if (typeof window !== "undefined") window.removeEventListener("storage", onStorage);
    };
  }
}
