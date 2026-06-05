import type { Profissional } from "@/domain/profissional/Profissional";

export interface IProfissionalService {
  listar(): Promise<Profissional[]>;
  obterPorId(id: string): Promise<Profissional | null>;
}
