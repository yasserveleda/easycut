export interface Bloqueio {
  id: string;
  profissionalId?: string;
  data: string;
  horaInicio: string;
  duracaoMin: number;
  motivo?: string;
}

export type CriarBloqueioRequest = Omit<Bloqueio, "id">;
