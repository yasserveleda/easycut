import type { Profissional } from "@/domain/profissional/Profissional";
import type { IProfissionalService } from "./IProfissionalService";

export class ProfissionalServiceHttp implements IProfissionalService {
  async listar(): Promise<Profissional[]> {
    throw new Error("ProfissionalServiceHttp.listar: Not implemented");
  }
  async obterPorId(_id: string): Promise<Profissional | null> {
    throw new Error("ProfissionalServiceHttp.obterPorId: Not implemented");
  }
}
