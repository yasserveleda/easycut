import type { Servico, SalvarServicoRequest } from "@/domain/servico/Servico";
import type { IServicoService } from "./IServicoService";

/**
 * Stub HTTP. Será implementado quando o BFF estiver disponível,
 * usando `ApiConfig.baseUrl` em `src/config/api.ts`.
 */
export class ServicoServiceHttp implements IServicoService {
  async listar(): Promise<Servico[]> {
    throw new Error("ServicoServiceHttp.listar: Not implemented");
  }
  async obterPorId(_id: string): Promise<Servico | null> {
    throw new Error("ServicoServiceHttp.obterPorId: Not implemented");
  }
  async salvar(_payload: SalvarServicoRequest): Promise<void> {
    throw new Error("ServicoServiceHttp.salvar: Not implemented");
  }
  async remover(_id: string): Promise<void> {
    throw new Error("ServicoServiceHttp.remover: Not implemented");
  }
}
