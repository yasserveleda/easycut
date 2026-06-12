import type { Configuracao } from "@/domain/configuracao/Configuracao";
import { localStorageService, STORAGE_KEYS } from "@/infrastructure/storage/LocalStorageService";
import { defaultBusinessHours } from "@/lib/scheduling";
import type { IConfiguracaoService } from "./IConfiguracaoService";

const padrao: Configuracao = {
  nomeSalao: "Atelier Estúdio",
  bufferMin: 0,
  horarios: defaultBusinessHours(),
};

export class ConfiguracaoServiceLocal implements IConfiguracaoService {
  async obter(): Promise<Configuracao | null> {
    return localStorageService.get<Configuracao>(STORAGE_KEYS.configuracao) ?? padrao;
  }
  async atualizar(patch: Partial<Configuracao>): Promise<void> {
    const atual = (await this.obter()) ?? padrao;
    localStorageService.set(STORAGE_KEYS.configuracao, { ...atual, ...patch });
  }
}
