import type { Servico, SalvarServicoRequest } from "@/domain/servico/Servico";
import { localStorageService, STORAGE_KEYS } from "@/infrastructure/storage/LocalStorageService";
import type { IServicoService } from "./IServicoService";

export class ServicoServiceLocal implements IServicoService {
  private read(): Servico[] {
    return localStorageService.get<Servico[]>(STORAGE_KEYS.servicos) ?? [];
  }
  private write(list: Servico[]) {
    localStorageService.set(STORAGE_KEYS.servicos, list);
  }

  async listar(): Promise<Servico[]> {
    return [...this.read()].sort((a, b) => a.nome.localeCompare(b.nome));
  }

  async obterPorId(id: string): Promise<Servico | null> {
    return this.read().find((s) => s.id === id) ?? null;
  }

  async salvar(payload: SalvarServicoRequest): Promise<void> {
    const list = this.read();
    if (payload.id) {
      const idx = list.findIndex((s) => s.id === payload.id);
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...payload, id: payload.id } as Servico;
      } else {
        list.push({ ...payload, id: payload.id } as Servico);
      }
    } else {
      list.push({ ...payload, id: crypto.randomUUID() } as Servico);
    }
    this.write(list);
  }

  async remover(id: string): Promise<void> {
    this.write(this.read().filter((s) => s.id !== id));
  }
}
