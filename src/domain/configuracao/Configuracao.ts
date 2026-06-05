import type { BusinessHours } from "@/lib/types";

/** Horário de funcionamento por dia da semana (0 = domingo, 6 = sábado). */
export type HorarioFuncionamento = BusinessHours;

export interface Configuracao {
  nomeSalao: string;
  bufferMin: number;
  horarios: HorarioFuncionamento[];
}
