import type { Profissional } from "@/domain/profissional/Profissional";
import { localStorageService, STORAGE_KEYS } from "@/infrastructure/storage/LocalStorageService";
import type { IProfissionalService } from "./IProfissionalService";

export class ProfissionalServiceLocal implements IProfissionalService {
  private read(): Profissional[] {
    return localStorageService.get<Profissional[]>(STORAGE_KEYS.profissionais) ?? [];
  }

  async listar(): Promise<Profissional[]> {
    return [...this.read()].sort((a, b) => a.nome.localeCompare(b.nome));
  }

  async obterPorId(id: string): Promise<Profissional | null> {
    return this.read().find((p) => p.id === id) ?? null;
  }
}
