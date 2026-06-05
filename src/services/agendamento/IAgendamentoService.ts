import type { Agendamento, AgendamentoOcupado } from "@/domain/agendamento/Agendamento";
import type {
  AlterarStatusAgendamentoRequest,
  CancelarPorTelefoneRequest,
  CriarAgendamentoRequest,
} from "@/domain/agendamento/requests";

export interface IAgendamentoService {
  /** Lista completa (uso administrativo). */
  listar(): Promise<Agendamento[]>;

  /** Slots ocupados para visualização pública (sem PII). */
  listarOcupados(de: string, ate: string): Promise<AgendamentoOcupado[]>;

  /** Lista agendamentos por telefone do cliente (sem login). */
  listarPorTelefone(telefone: string): Promise<Agendamento[]>;

  /** Cria agendamento público (rota validada no servidor). */
  criar(payload: CriarAgendamentoRequest): Promise<Agendamento>;

  /** Atualiza status (uso administrativo). */
  alterarStatus(payload: AlterarStatusAgendamentoRequest): Promise<void>;

  /** Cancela um agendamento próprio via verificação por telefone. */
  cancelarPorTelefone(payload: CancelarPorTelefoneRequest): Promise<boolean>;
}
