import { supabase } from "@/integrations/supabase/client";
import type { Configuracao, HorarioFuncionamento } from "@/domain/configuracao/Configuracao";
import type { IConfiguracaoService } from "./IConfiguracaoService";

interface SettingsRow {
  id: string;
  salon_name: string;
  buffer_min: number;
  business_hours: HorarioFuncionamento[] | null;
}

export class ConfiguracaoServiceMock implements IConfiguracaoService {
  async obter(): Promise<Configuracao | null> {
    const { data, error } = await supabase
      .from("settings")
      .select("*")
      .eq("id", "default")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return null;
    const row = data as SettingsRow;
    return {
      nomeSalao: row.salon_name,
      bufferMin: row.buffer_min,
      horarios: row.business_hours ?? [],
    };
  }

  async atualizar(patch: Partial<Configuracao>): Promise<void> {
    const update: {
      salon_name?: string;
      buffer_min?: number;
      business_hours?: unknown;
      updated_at: string;
    } = { updated_at: new Date().toISOString() };
    if (patch.nomeSalao !== undefined) update.salon_name = patch.nomeSalao;
    if (patch.bufferMin !== undefined) update.buffer_min = patch.bufferMin;
    if (patch.horarios !== undefined) update.business_hours = patch.horarios;
    const { error } = await supabase
      .from("settings")
      .update(update as never)
      .eq("id", "default");
    if (error) throw new Error(error.message);
  }
}
