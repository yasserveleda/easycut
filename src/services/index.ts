/**
 * Factory central de serviços — único ponto onde se decide entre
 * a implementação Mock (atual, apoiada em Lovable Cloud) e a HTTP
 * (futura, apoiada em BFF).
 *
 * Para trocar Mock → HTTP, basta instanciar as classes *Http aqui.
 * Nenhuma tela precisa ser alterada.
 */
import { AgendamentoServiceMock } from "./agendamento/AgendamentoServiceMock";
import type { IAgendamentoService } from "./agendamento/IAgendamentoService";
import { BloqueioServiceMock } from "./bloqueio/BloqueioServiceMock";
import type { IBloqueioService } from "./bloqueio/IBloqueioService";
import { ConfiguracaoServiceMock } from "./configuracao/ConfiguracaoServiceMock";
import type { IConfiguracaoService } from "./configuracao/IConfiguracaoService";
import { ProfissionalServiceMock } from "./profissional/ProfissionalServiceMock";
import type { IProfissionalService } from "./profissional/IProfissionalService";
import { RealtimeServiceMock } from "./realtime/RealtimeServiceMock";
import type { IRealtimeService } from "./realtime/IRealtimeService";
import { ServicoServiceMock } from "./servico/ServicoServiceMock";
import type { IServicoService } from "./servico/IServicoService";
import { UsuarioServiceMock } from "./usuario/UsuarioServiceMock";
import type { IUsuarioService } from "./usuario/IUsuarioService";

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
  agendamento: new AgendamentoServiceMock(),
  bloqueio: new BloqueioServiceMock(),
  configuracao: new ConfiguracaoServiceMock(),
  profissional: new ProfissionalServiceMock(),
  realtime: new RealtimeServiceMock(),
  servico: new ServicoServiceMock(),
  usuario: new UsuarioServiceMock(),
};

// Re-exports para conveniência.
export type { IAgendamentoService } from "./agendamento/IAgendamentoService";
export type { IBloqueioService } from "./bloqueio/IBloqueioService";
export type { IConfiguracaoService } from "./configuracao/IConfiguracaoService";
export type { IProfissionalService } from "./profissional/IProfissionalService";
export type { IRealtimeService, TabelaRealtime } from "./realtime/IRealtimeService";
export type { IServicoService } from "./servico/IServicoService";
export type { IUsuarioService } from "./usuario/IUsuarioService";
