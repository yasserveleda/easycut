import { localStorageService, STORAGE_KEYS } from "./LocalStorageService";
import type { Servico } from "@/domain/servico/Servico";
import { CategoriaServico } from "@/domain/servico/enums";
import type { Profissional } from "@/domain/profissional/Profissional";
import type { Configuracao } from "@/domain/configuracao/Configuracao";
import type { Agendamento } from "@/domain/agendamento/Agendamento";
import { AgendamentoStatus } from "@/domain/agendamento/enums";
import { defaultBusinessHours } from "@/lib/scheduling";

const seedServicos: Servico[] = [
  { id: "svc-corte-masc", nome: "Corte Masculino", descricao: "Corte clássico ou moderno na tesoura e máquina.", preco: 60, duracaoMin: 30, categoria: CategoriaServico.CABELO, cor: "#5A8DA8", ativo: true },
  { id: "svc-barba", nome: "Barba", descricao: "Modelagem completa com toalha quente.", preco: 45, duracaoMin: 30, categoria: CategoriaServico.BARBA, cor: "#7B5E3B", ativo: true },
  { id: "svc-corte-barba", nome: "Corte + Barba", descricao: "Combo completo com acabamento premium.", preco: 95, duracaoMin: 60, categoria: CategoriaServico.COMBO, cor: "#D9A441", ativo: true },
  { id: "svc-hidratacao", nome: "Hidratação Capilar", descricao: "Tratamento revitalizante para os fios.", preco: 80, duracaoMin: 45, categoria: CategoriaServico.ESTETICA, cor: "#8E5A8C", ativo: true },
];

const seedProfissionais: Profissional[] = [
  { id: "pro-rafael", nome: "Rafael Souza", cargo: "Barbeiro Sênior", corAvatar: "#5A8DA8", servicoIds: ["svc-corte-masc", "svc-barba", "svc-corte-barba"] },
  { id: "pro-julia", nome: "Júlia Martins", cargo: "Cabeleireira", corAvatar: "#C56E8E", servicoIds: ["svc-corte-masc", "svc-hidratacao"] },
  { id: "pro-andre", nome: "André Lima", cargo: "Barbeiro", corAvatar: "#3B7A57", servicoIds: ["svc-corte-masc", "svc-barba", "svc-corte-barba"] },
];

const seedConfiguracao: Configuracao = {
  nomeSalao: "Atelier Estúdio",
  bufferMin: 0,
  horarios: defaultBusinessHours(),
};

function exemploAgendamentos(): Agendamento[] {
  const hoje = new Date();
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  const amanha = new Date(hoje); amanha.setDate(amanha.getDate() + 1);
  return [
    {
      id: crypto.randomUUID(),
      servicoId: "svc-corte-barba",
      profissionalId: "pro-rafael",
      clienteNome: "Cliente Exemplo",
      clienteTelefone: "(11) 98888-7777",
      data: iso(amanha),
      horaInicio: "10:00",
      duracaoMin: 60,
      status: AgendamentoStatus.CONFIRMADO,
      criadoEm: new Date().toISOString(),
    },
  ];
}

/**
 * Garante que existam dados iniciais quando o LocalStorage está vazio.
 * Idempotente: roda no primeiro carregamento e nunca sobrescreve dados do usuário.
 */
export function aplicarSeedSeNecessario(): void {
  if (localStorageService.get(STORAGE_KEYS.seedAplicado)) return;

  if (!localStorageService.get(STORAGE_KEYS.servicos)) {
    localStorageService.set(STORAGE_KEYS.servicos, seedServicos);
  }
  if (!localStorageService.get(STORAGE_KEYS.profissionais)) {
    localStorageService.set(STORAGE_KEYS.profissionais, seedProfissionais);
  }
  if (!localStorageService.get(STORAGE_KEYS.configuracao)) {
    localStorageService.set(STORAGE_KEYS.configuracao, seedConfiguracao);
  }
  if (!localStorageService.get(STORAGE_KEYS.agendamentos)) {
    localStorageService.set(STORAGE_KEYS.agendamentos, exemploAgendamentos());
  }
  if (!localStorageService.get(STORAGE_KEYS.bloqueios)) {
    localStorageService.set(STORAGE_KEYS.bloqueios, []);
  }
  if (!localStorageService.get(STORAGE_KEYS.usuarios)) {
    localStorageService.set(STORAGE_KEYS.usuarios, []);
  }

  localStorageService.set(STORAGE_KEYS.seedAplicado, true);
}
