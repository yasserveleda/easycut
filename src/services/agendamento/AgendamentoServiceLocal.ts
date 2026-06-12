import type { Agendamento, AgendamentoOcupado } from "@/domain/agendamento/Agendamento";
import { AgendamentoStatus } from "@/domain/agendamento/enums";
import type {
  AlterarStatusAgendamentoRequest,
  CancelarPorTelefoneRequest,
  CriarAgendamentoRequest,
} from "@/domain/agendamento/requests";
import type { Servico } from "@/domain/servico/Servico";
import type { Profissional } from "@/domain/profissional/Profissional";
import { localStorageService, STORAGE_KEYS } from "@/infrastructure/storage/LocalStorageService";
import type { IAgendamentoService } from "./IAgendamentoService";

const onlyDigits = (v: string) => v.replace(/\D/g, "");

export class AgendamentoServiceLocal implements IAgendamentoService {
  private read(): Agendamento[] {
    return localStorageService.get<Agendamento[]>(STORAGE_KEYS.agendamentos) ?? [];
  }
  private write(list: Agendamento[]) {
    localStorageService.set(STORAGE_KEYS.agendamentos, list);
  }

  async listar(): Promise<Agendamento[]> {
    return [...this.read()];
  }

  async listarOcupados(de: string, ate: string): Promise<AgendamentoOcupado[]> {
    return this.read()
      .filter((a) => a.status !== AgendamentoStatus.CANCELADO && a.data >= de && a.data <= ate)
      .map((a) => ({
        profissionalId: a.profissionalId,
        data: a.data,
        horaInicio: a.horaInicio,
        duracaoMin: a.duracaoMin,
        status: a.status,
      }));
  }

  async listarPorTelefone(telefone: string): Promise<Agendamento[]> {
    const target = onlyDigits(telefone);
    return this.read()
      .filter((a) => onlyDigits(a.clienteTelefone) === target)
      .sort((a, b) => (a.data + a.horaInicio).localeCompare(b.data + b.horaInicio));
  }

  async criar(payload: CriarAgendamentoRequest): Promise<Agendamento> {
    const servicos = localStorageService.get<Servico[]>(STORAGE_KEYS.servicos) ?? [];
    const profissionais = localStorageService.get<Profissional[]>(STORAGE_KEYS.profissionais) ?? [];
    const servico = servicos.find((s) => s.id === payload.servicoId && s.ativo);
    if (!servico) throw new Error("Serviço indisponível para agendamento");
    const profissional = profissionais.find((p) => p.id === payload.profissionalId);
    if (!profissional || !profissional.servicoIds.includes(payload.servicoId)) {
      throw new Error("Profissional indisponível para este serviço");
    }

    const novo: Agendamento = {
      id: crypto.randomUUID(),
      servicoId: payload.servicoId,
      profissionalId: payload.profissionalId,
      clienteNome: payload.clienteNome.trim(),
      clienteTelefone: payload.clienteTelefone.trim(),
      clienteEmail: payload.clienteEmail?.trim() || undefined,
      data: payload.data,
      horaInicio: payload.horaInicio,
      duracaoMin: servico.duracaoMin,
      status: AgendamentoStatus.PENDENTE,
      observacoes: payload.observacoes?.trim() || undefined,
      criadoEm: new Date().toISOString(),
    };

    const list = this.read();
    list.push(novo);
    this.write(list);
    return novo;
  }

  async alterarStatus(payload: AlterarStatusAgendamentoRequest): Promise<void> {
    const list = this.read();
    const idx = list.findIndex((a) => a.id === payload.id);
    if (idx < 0) return;
    list[idx] = { ...list[idx], status: payload.status };
    this.write(list);
  }

  async cancelarPorTelefone(payload: CancelarPorTelefoneRequest): Promise<boolean> {
    const list = this.read();
    const target = onlyDigits(payload.telefone);
    const idx = list.findIndex(
      (a) =>
        a.id === payload.id &&
        onlyDigits(a.clienteTelefone) === target &&
        a.status !== AgendamentoStatus.CANCELADO &&
        a.status !== AgendamentoStatus.FINALIZADO,
    );
    if (idx < 0) return false;
    list[idx] = { ...list[idx], status: AgendamentoStatus.CANCELADO };
    this.write(list);
    return true;
  }
}
