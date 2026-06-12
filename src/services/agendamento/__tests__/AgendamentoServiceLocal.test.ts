import { describe, it, expect, beforeEach } from "vitest";
import { AgendamentoServiceLocal } from "@/services/agendamento/AgendamentoServiceLocal";
import { localStorageService, STORAGE_KEYS } from "@/infrastructure/storage/LocalStorageService";
import type { Servico } from "@/domain/servico/Servico";
import type { Profissional } from "@/domain/profissional/Profissional";
import { CategoriaServico } from "@/domain/servico/enums";

const SVC: Servico = {
  id: "svc-1",
  nome: "Corte",
  descricao: "",
  preco: 50,
  duracaoMin: 30,
  categoria: CategoriaServico.CABELO,
  cor: "#000",
  ativo: true,
};
const PRO: Profissional = {
  id: "pro-1",
  nome: "Rafa",
  cargo: "Barbeiro",
  corAvatar: "#000",
  servicoIds: ["svc-1"],
};

describe("AgendamentoServiceLocal — buscar por telefone", () => {
  beforeEach(() => {
    window.localStorage.clear();
    localStorageService.set(STORAGE_KEYS.servicos, [SVC]);
    localStorageService.set(STORAGE_KEYS.profissionais, [PRO]);
    localStorageService.set(STORAGE_KEYS.agendamentos, []);
  });

  it("encontra o agendamento recém-criado usando o mesmo telefone digitado", async () => {
    const svc = new AgendamentoServiceLocal();
    await svc.criar({
      servicoId: "svc-1",
      profissionalId: "pro-1",
      clienteNome: "Cliente Teste",
      clienteTelefone: "(51) 99902-5553",
      data: "2026-06-20",
      horaInicio: "10:00",
    });
    const found = await svc.listarPorTelefone("51999025553");
    expect(found).toHaveLength(1);
    expect(found[0].clienteNome).toBe("Cliente Teste");
  });

  it("encontra mesmo quando o telefone foi salvo só com dígitos e buscado formatado", async () => {
    const svc = new AgendamentoServiceLocal();
    await svc.criar({
      servicoId: "svc-1",
      profissionalId: "pro-1",
      clienteNome: "X",
      clienteTelefone: "51999025553",
      data: "2026-06-20",
      horaInicio: "11:00",
    });
    const found = await svc.listarPorTelefone("(51) 99902-5553");
    expect(found).toHaveLength(1);
  });

  it("retorna vazio quando o telefone não confere", async () => {
    const svc = new AgendamentoServiceLocal();
    await svc.criar({
      servicoId: "svc-1",
      profissionalId: "pro-1",
      clienteNome: "X",
      clienteTelefone: "51999025553",
      data: "2026-06-20",
      horaInicio: "11:00",
    });
    const found = await svc.listarPorTelefone("11988887777");
    expect(found).toHaveLength(0);
  });

  it("uma segunda instância do service enxerga o agendamento gravado pela primeira (mesmo localStorage)", async () => {
    const a = new AgendamentoServiceLocal();
    await a.criar({
      servicoId: "svc-1",
      profissionalId: "pro-1",
      clienteNome: "Persiste",
      clienteTelefone: "51999025553",
      data: "2026-06-20",
      horaInicio: "12:00",
    });
    const b = new AgendamentoServiceLocal();
    const found = await b.listarPorTelefone("51999025553");
    expect(found).toHaveLength(1);
    expect(found[0].clienteNome).toBe("Persiste");
  });
});
