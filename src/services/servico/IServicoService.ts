import type { Servico, SalvarServicoRequest } from "@/domain/servico/Servico";

export interface IServicoService {
  listar(): Promise<Servico[]>;
  obterPorId(id: string): Promise<Servico | null>;
  salvar(payload: SalvarServicoRequest): Promise<void>;
  remover(id: string): Promise<void>;
}
