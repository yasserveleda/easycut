import type { AgendamentoStatus } from "./enums";

export interface Agendamento {
  id: string;
  servicoId: string;
  profissionalId: string;
  clienteNome: string;
  clienteTelefone: string;
  clienteEmail?: string;
  /** ISO date string yyyy-mm-dd */
  data: string;
  /** "HH:mm" */
  horaInicio: string;
  duracaoMin: number;
  status: AgendamentoStatus;
  observacoes?: string;
  criadoEm: string;
}

/** Slot ocupado (sem PII) — usado em visualizações públicas. */
export interface AgendamentoOcupado {
  profissionalId: string;
  data: string;
  horaInicio: string;
  duracaoMin: number;
  status: AgendamentoStatus;
}
