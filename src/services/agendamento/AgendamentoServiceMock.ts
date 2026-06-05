import { supabase } from "@/integrations/supabase/client";
import { createPublicAppointment } from "@/lib/appointments.functions";
import type { Agendamento, AgendamentoOcupado } from "@/domain/agendamento/Agendamento";
import { AgendamentoStatus } from "@/domain/agendamento/enums";
import type {
  AlterarStatusAgendamentoRequest,
  CancelarPorTelefoneRequest,
  CriarAgendamentoRequest,
} from "@/domain/agendamento/requests";
import type { IAgendamentoService } from "./IAgendamentoService";

interface ApptRow {
  id: string;
  service_id: string;
  staff_id: string;
  client_name: string;
  client_phone: string;
  client_email: string | null;
  date: string;
  start_time: string;
  duration_min: number;
  status: string;
  notes: string | null;
  created_at: string;
}

function fromRow(r: ApptRow): Agendamento {
  return {
    id: r.id,
    servicoId: r.service_id,
    profissionalId: r.staff_id,
    clienteNome: r.client_name,
    clienteTelefone: r.client_phone,
    clienteEmail: r.client_email ?? undefined,
    data: r.date,
    horaInicio: r.start_time,
    duracaoMin: r.duration_min,
    status: r.status as AgendamentoStatus,
    observacoes: r.notes ?? undefined,
    criadoEm: r.created_at,
  };
}

export class AgendamentoServiceMock implements IAgendamentoService {
  async listar(): Promise<Agendamento[]> {
    const { data, error } = await supabase.from("appointments").select("*");
    if (error) throw new Error(error.message);
    return (data ?? []).map((r) => fromRow(r as ApptRow));
  }

  async listarOcupados(de: string, ate: string): Promise<AgendamentoOcupado[]> {
    const { data, error } = await supabase.rpc("get_busy_slots", { _from: de, _to: ate });
    if (error) throw new Error(error.message);
    return (data ?? []).map((r) => ({
      profissionalId: r.staff_id,
      data: r.date,
      horaInicio: r.start_time,
      duracaoMin: r.duration_min,
      status: r.status as AgendamentoStatus,
    }));
  }

  async listarPorTelefone(telefone: string): Promise<Agendamento[]> {
    const { data, error } = await supabase.rpc("get_appointments_by_phone", { _phone: telefone });
    if (error) throw new Error(error.message);
    return (data ?? []).map((r) => fromRow(r as ApptRow));
  }

  async criar(payload: CriarAgendamentoRequest): Promise<Agendamento> {
    const result = await createPublicAppointment({
      data: {
        serviceId: payload.servicoId,
        staffId: payload.profissionalId,
        clientName: payload.clienteNome,
        clientPhone: payload.clienteTelefone,
        clientEmail: payload.clienteEmail ?? "",
        date: payload.data,
        startTime: payload.horaInicio,
        notes: payload.observacoes,
      },
    });
    return {
      id: result.id,
      servicoId: payload.servicoId,
      profissionalId: payload.profissionalId,
      clienteNome: payload.clienteNome,
      clienteTelefone: payload.clienteTelefone,
      clienteEmail: payload.clienteEmail,
      data: payload.data,
      horaInicio: payload.horaInicio,
      duracaoMin: result.durationMin,
      status: result.status as AgendamentoStatus,
      observacoes: payload.observacoes,
      criadoEm: result.createdAt,
    };
  }

  async alterarStatus(payload: AlterarStatusAgendamentoRequest): Promise<void> {
    const { error } = await supabase
      .from("appointments")
      .update({ status: payload.status })
      .eq("id", payload.id);
    if (error) throw new Error(error.message);
  }

  async cancelarPorTelefone(payload: CancelarPorTelefoneRequest): Promise<boolean> {
    const { data, error } = await supabase.rpc("cancel_appointment_by_phone", {
      _id: payload.id,
      _phone: payload.telefone,
    });
    if (error) throw new Error(error.message);
    return Boolean(data);
  }
}
