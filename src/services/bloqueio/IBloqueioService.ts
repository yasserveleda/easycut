import type { Bloqueio, CriarBloqueioRequest } from "@/domain/bloqueio/Bloqueio";

export interface IBloqueioService {
  listar(): Promise<Bloqueio[]>;
  criar(payload: CriarBloqueioRequest): Promise<void>;
  remover(id: string): Promise<void>;
}
