import { supabase } from "@/integrations/supabase/client";
import type { Profissional } from "@/domain/profissional/Profissional";
import type { IProfissionalService } from "./IProfissionalService";

interface StaffRow {
  id: string;
  name: string;
  role: string | null;
  avatar_color: string;
  service_ids: string[] | null;
}

function fromRow(r: StaffRow): Profissional {
  return {
    id: r.id,
    nome: r.name,
    cargo: r.role ?? "",
    corAvatar: r.avatar_color,
    servicoIds: r.service_ids ?? [],
  };
}

export class ProfissionalServiceMock implements IProfissionalService {
  async listar(): Promise<Profissional[]> {
    const { data, error } = await supabase.from("staff").select("*").order("name");
    if (error) throw new Error(error.message);
    return (data ?? []).map((r) => fromRow(r as StaffRow));
  }
  async obterPorId(id: string): Promise<Profissional | null> {
    const { data, error } = await supabase.from("staff").select("*").eq("id", id).maybeSingle();
    if (error) throw new Error(error.message);
    return data ? fromRow(data as StaffRow) : null;
  }
}
