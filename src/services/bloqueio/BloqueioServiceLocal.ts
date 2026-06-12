import type { Bloqueio, CriarBloqueioRequest } from "@/domain/bloqueio/Bloqueio";
import { localStorageService, STORAGE_KEYS } from "@/infrastructure/storage/LocalStorageService";
import type { IBloqueioService } from "./IBloqueioService";

export class BloqueioServiceLocal implements IBloqueioService {
  private read(): Bloqueio[] {
    return localStorageService.get<Bloqueio[]>(STORAGE_KEYS.bloqueios) ?? [];
  }
  private write(list: Bloqueio[]) {
    localStorageService.set(STORAGE_KEYS.bloqueios, list);
  }

  async listar(): Promise<Bloqueio[]> {
    return [...this.read()];
  }
  async criar(payload: CriarBloqueioRequest): Promise<void> {
    const list = this.read();
    list.push({ ...payload, id: crypto.randomUUID() });
    this.write(list);
  }
  async remover(id: string): Promise<void> {
    this.write(this.read().filter((b) => b.id !== id));
  }
}
