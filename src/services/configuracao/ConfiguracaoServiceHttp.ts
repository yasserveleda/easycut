import type { Configuracao } from "@/domain/configuracao/Configuracao";
import type { IConfiguracaoService } from "./IConfiguracaoService";

export class ConfiguracaoServiceHttp implements IConfiguracaoService {
  async obter(): Promise<Configuracao | null> {
    throw new Error("ConfiguracaoServiceHttp.obter: Not implemented");
  }
  async atualizar(_patch: Partial<Configuracao>): Promise<void> {
    throw new Error("ConfiguracaoServiceHttp.atualizar: Not implemented");
  }
}
