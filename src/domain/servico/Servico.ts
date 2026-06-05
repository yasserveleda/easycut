import type { CategoriaServico } from "./enums";

export interface Servico {
  id: string;
  nome: string;
  descricao: string;
  preco: number;
  duracaoMin: number;
  categoria: CategoriaServico;
  cor: string;
  ativo: boolean;
}

export type SalvarServicoRequest = Omit<Servico, "id"> & { id?: string };
