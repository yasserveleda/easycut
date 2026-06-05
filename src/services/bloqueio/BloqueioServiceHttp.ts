import type { Bloqueio, CriarBloqueioRequest } from "@/domain/bloqueio/Bloqueio";
import type { IBloqueioService } from "./IBloqueioService";

export class BloqueioServiceHttp implements IBloqueioService {
  async listar(): Promise<Bloqueio[]> {
    throw new Error("BloqueioServiceHttp.listar: Not implemented");
  }
  async criar(_payload: CriarBloqueioRequest): Promise<void> {
    throw new Error("BloqueioServiceHttp.criar: Not implemented");
  }
  async remover(_id: string): Promise<void> {
    throw new Error("BloqueioServiceHttp.remover: Not implemented");
  }
}
