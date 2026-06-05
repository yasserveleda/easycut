import type { EventoAutenticacao, SessaoUsuario } from "@/domain/usuario/Usuario";
import type {
  CadastroRequest,
  LoginGoogleRequest,
  LoginRequest,
  NovaSenhaRequest,
  RecuperarSenhaRequest,
} from "@/domain/usuario/requests";

export interface IUsuarioService {
  obterSessao(): Promise<SessaoUsuario | null>;
  onMudancaSessao(cb: (evento: EventoAutenticacao, sessao: SessaoUsuario | null) => void): () => void;

  ehAdmin(usuarioId: string): Promise<boolean>;

  login(payload: LoginRequest): Promise<void>;
  loginGoogle(payload: LoginGoogleRequest): Promise<void>;
  cadastrar(payload: CadastroRequest): Promise<void>;
  recuperarSenha(payload: RecuperarSenhaRequest): Promise<void>;
  redefinirSenha(payload: NovaSenhaRequest): Promise<void>;
  sair(): Promise<void>;
}
