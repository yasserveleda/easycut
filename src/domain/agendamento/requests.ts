import type { AgendamentoStatus } from "./enums";

export interface CriarAgendamentoRequest {
  servicoId: string;
  profissionalId: string;
  clienteNome: string;
  clienteTelefone: string;
  clienteEmail?: string;
  data: string;
  horaInicio: string;
  observacoes?: string;
}

export interface AlterarStatusAgendamentoRequest {
  id: string;
  status: AgendamentoStatus;
}

export interface CancelarPorTelefoneRequest {
  id: string;
  telefone: string;
}
