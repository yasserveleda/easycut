import { supabase } from "@/integrations/supabase/client";
import type { Bloqueio, CriarBloqueioRequest } from "@/domain/bloqueio/Bloqueio";
import type { IBloqueioService } from "./IBloqueioService";

interface BlockedRow {
  id: string;
  staff_id: string | null;
  date: string;
  start_time: string;
  duration_min: number;
  reason: string | null;
}

function fromRow(r: BlockedRow): Bloqueio {
  return {
    id: r.id,
    profissionalId: r.staff_id ?? undefined,
    data: r.date,
    horaInicio: r.start_time,
    duracaoMin: r.duration_min,
    motivo: r.reason ?? undefined,
  };
}

export class BloqueioServiceMock implements IBloqueioService {
  async listar(): Promise<Bloqueio[]> {
    const { data, error } = await supabase.from("blocked_slots").select("*");
    if (error) throw new Error(error.message);
    return (data ?? []).map((r) => fromRow(r as BlockedRow));
  }
  async criar(payload: CriarBloqueioRequest): Promise<void> {
    const { error } = await supabase.from("blocked_slots").insert({
      staff_id: payload.profissionalId ?? null,
      date: payload.data,
      start_time: payload.horaInicio,
      duration_min: payload.duracaoMin,
      reason: payload.motivo ?? null,
    });
    if (error) throw new Error(error.message);
  }
  async remover(id: string): Promise<void> {
    const { error } = await supabase.from("blocked_slots").delete().eq("id", id);
    if (error) throw new Error(error.message);
  }
}
