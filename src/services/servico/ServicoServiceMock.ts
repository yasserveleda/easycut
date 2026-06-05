import { supabase } from "@/integrations/supabase/client";
import type { Servico, SalvarServicoRequest } from "@/domain/servico/Servico";
import type { CategoriaServico } from "@/domain/servico/enums";
import type { IServicoService } from "./IServicoService";

interface ServicoRow {
  id: string;
  name: string;
  description: string | null;
  price: number | string;
  duration_min: number;
  category: string;
  color: string;
  active: boolean;
}

function fromRow(r: ServicoRow): Servico {
  return {
    id: r.id,
    nome: r.name,
    descricao: r.description ?? "",
    preco: Number(r.price),
    duracaoMin: r.duration_min,
    categoria: r.category as CategoriaServico,
    cor: r.color,
    ativo: r.active,
  };
}

export class ServicoServiceMock implements IServicoService {
  async listar(): Promise<Servico[]> {
    const { data, error } = await supabase.from("services").select("*").order("name");
    if (error) throw new Error(error.message);
    return (data ?? []).map((r) => fromRow(r as ServicoRow));
  }

  async obterPorId(id: string): Promise<Servico | null> {
    const { data, error } = await supabase.from("services").select("*").eq("id", id).maybeSingle();
    if (error) throw new Error(error.message);
    return data ? fromRow(data as ServicoRow) : null;
  }

  async salvar(payload: SalvarServicoRequest): Promise<void> {
    const row = {
      name: payload.nome,
      description: payload.descricao,
      price: payload.preco,
      duration_min: payload.duracaoMin,
      category: payload.categoria,
      color: payload.cor,
      active: payload.ativo,
    };
    if (payload.id) {
      const { error } = await supabase.from("services").update(row).eq("id", payload.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabase.from("services").insert(row);
      if (error) throw new Error(error.message);
    }
  }

  async remover(id: string): Promise<void> {
    const { error } = await supabase.from("services").delete().eq("id", id);
    if (error) throw new Error(error.message);
  }
}
