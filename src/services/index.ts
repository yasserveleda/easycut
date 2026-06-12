/**
 * Factory central de serviços — único ponto onde se decide a implementação
 * usada pela aplicação. Hoje todos os serviços rodam 100% offline em cima
 * de LocalStorage (`*ServiceLocal`). Para migrar para um BFF HTTP no
 * futuro, basta trocar as instâncias abaixo pelas `*Http` correspondentes.
 *
 * Nenhuma tela precisa ser alterada.
 */
import { aplicarSeedSeNecessario } from "@/infrastructure/storage/seed";

import { AgendamentoServiceLocal } from "./agendamento/AgendamentoServiceLocal";
import type { IAgendamentoService } from "./agendamento/IAgendamentoService";
import { BloqueioServiceLocal } from "./bloqueio/BloqueioServiceLocal";
import type { IBloqueioService } from "./bloqueio/IBloqueioService";
import { ConfiguracaoServiceLocal } from "./configuracao/ConfiguracaoServiceLocal";
import type { IConfiguracaoService } from "./configuracao/IConfiguracaoService";
import { ProfissionalServiceLocal } from "./profissional/ProfissionalServiceLocal";
import type { IProfissionalService } from "./profissional/IProfissionalService";
import { RealtimeServiceLocal } from "./realtime/RealtimeServiceLocal";
import type { IRealtimeService } from "./realtime/IRealtimeService";
import { ServicoServiceLocal } from "./servico/ServicoServiceLocal";
import type { IServicoService } from "./servico/IServicoService";
import { UsuarioServiceLocal } from "./usuario/UsuarioServiceLocal";
import type { IUsuarioService } from "./usuario/IUsuarioService";

// Garante seed inicial antes da primeira leitura.
aplicarSeedSeNecessario();

export interface ServiceRegistry {
  agendamento: IAgendamentoService;
  bloqueio: IBloqueioService;
  configuracao: IConfiguracaoService;
  profissional: IProfissionalService;
  realtime: IRealtimeService;
  servico: IServicoService;
  usuario: IUsuarioService;
}

export const Services: ServiceRegistry = {
  agendamento: new AgendamentoServiceLocal(),
  bloqueio: new BloqueioServiceLocal(),
  configuracao: new ConfiguracaoServiceLocal(),
  profissional: new ProfissionalServiceLocal(),
  realtime: new RealtimeServiceLocal(),
  servico: new ServicoServiceLocal(),
  usuario: new UsuarioServiceLocal(),
};

// Re-exports para conveniência.
export type { IAgendamentoService } from "./agendamento/IAgendamentoService";
export type { IBloqueioService } from "./bloqueio/IBloqueioService";
export type { IConfiguracaoService } from "./configuracao/IConfiguracaoService";
export type { IProfissionalService } from "./profissional/IProfissionalService";
export type { IRealtimeService, TabelaRealtime } from "./realtime/IRealtimeService";
export type { IServicoService } from "./servico/IServicoService";
export type { IUsuarioService } from "./usuario/IUsuarioService";
