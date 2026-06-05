import type { Configuracao } from "@/domain/configuracao/Configuracao";

export interface IConfiguracaoService {
  obter(): Promise<Configuracao | null>;
  atualizar(patch: Partial<Configuracao>): Promise<void>;
}
