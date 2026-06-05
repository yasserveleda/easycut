import type { EventoAutenticacao, SessaoUsuario } from "@/domain/usuario/Usuario";
import type {
  CadastroRequest,
  LoginGoogleRequest,
  LoginRequest,
  NovaSenhaRequest,
  RecuperarSenhaRequest,
} from "@/domain/usuario/requests";
import type { IUsuarioService } from "./IUsuarioService";

export class UsuarioServiceHttp implements IUsuarioService {
  async obterSessao(): Promise<SessaoUsuario | null> {
    throw new Error("UsuarioServiceHttp.obterSessao: Not implemented");
  }
  onMudancaSessao(
    _cb: (evento: EventoAutenticacao, sessao: SessaoUsuario | null) => void,
  ): () => void {
    throw new Error("UsuarioServiceHttp.onMudancaSessao: Not implemented");
  }
  async ehAdmin(_usuarioId: string): Promise<boolean> {
    throw new Error("UsuarioServiceHttp.ehAdmin: Not implemented");
  }
  async login(_payload: LoginRequest): Promise<void> {
    throw new Error("UsuarioServiceHttp.login: Not implemented");
  }
  async loginGoogle(_payload: LoginGoogleRequest): Promise<void> {
    throw new Error("UsuarioServiceHttp.loginGoogle: Not implemented");
  }
  async cadastrar(_payload: CadastroRequest): Promise<void> {
    throw new Error("UsuarioServiceHttp.cadastrar: Not implemented");
  }
  async recuperarSenha(_payload: RecuperarSenhaRequest): Promise<void> {
    throw new Error("UsuarioServiceHttp.recuperarSenha: Not implemented");
  }
  async redefinirSenha(_payload: NovaSenhaRequest): Promise<void> {
    throw new Error("UsuarioServiceHttp.redefinirSenha: Not implemented");
  }
  async sair(): Promise<void> {
    throw new Error("UsuarioServiceHttp.sair: Not implemented");
  }
}
