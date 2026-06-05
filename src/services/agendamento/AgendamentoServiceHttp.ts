import type { Agendamento, AgendamentoOcupado } from "@/domain/agendamento/Agendamento";
import type {
  AlterarStatusAgendamentoRequest,
  CancelarPorTelefoneRequest,
  CriarAgendamentoRequest,
} from "@/domain/agendamento/requests";
import type { IAgendamentoService } from "./IAgendamentoService";

export class AgendamentoServiceHttp implements IAgendamentoService {
  async listar(): Promise<Agendamento[]> {
    throw new Error("AgendamentoServiceHttp.listar: Not implemented");
  }
  async listarOcupados(_de: string, _ate: string): Promise<AgendamentoOcupado[]> {
    throw new Error("AgendamentoServiceHttp.listarOcupados: Not implemented");
  }
  async listarPorTelefone(_telefone: string): Promise<Agendamento[]> {
    throw new Error("AgendamentoServiceHttp.listarPorTelefone: Not implemented");
  }
  async criar(_payload: CriarAgendamentoRequest): Promise<Agendamento> {
    throw new Error("AgendamentoServiceHttp.criar: Not implemented");
  }
  async alterarStatus(_payload: AlterarStatusAgendamentoRequest): Promise<void> {
    throw new Error("AgendamentoServiceHttp.alterarStatus: Not implemented");
  }
  async cancelarPorTelefone(_payload: CancelarPorTelefoneRequest): Promise<boolean> {
    throw new Error("AgendamentoServiceHttp.cancelarPorTelefone: Not implemented");
  }
}
