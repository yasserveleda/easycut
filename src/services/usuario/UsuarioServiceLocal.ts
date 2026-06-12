import type { EventoAutenticacao, SessaoUsuario, Usuario } from "@/domain/usuario/Usuario";
import type {
  CadastroRequest,
  LoginGoogleRequest,
  LoginRequest,
  NovaSenhaRequest,
  RecuperarSenhaRequest,
} from "@/domain/usuario/requests";
import { localStorageService, STORAGE_KEYS } from "@/infrastructure/storage/LocalStorageService";
import type { IUsuarioService } from "./IUsuarioService";

interface UsuarioPersistido {
  id: string;
  nome: string;
  email: string;
  /** Senha em texto plano — aceitável apenas em modo offline/local. */
  senha: string;
  admin: boolean;
}

type Callback = (evento: EventoAutenticacao, sessao: SessaoUsuario | null) => void;

/**
 * Implementação puramente local de autenticação. Sem backend, sem e-mail,
 * sem OAuth real. Primeiro usuário cadastrado vira admin.
 *
 * Não é seguro para produção — destinado a permitir uso da aplicação
 * enquanto o BFF real não existe.
 */
export class UsuarioServiceLocal implements IUsuarioService {
  private listeners = new Set<Callback>();

  private readUsuarios(): UsuarioPersistido[] {
    return localStorageService.get<UsuarioPersistido[]>(STORAGE_KEYS.usuarios) ?? [];
  }
  private writeUsuarios(list: UsuarioPersistido[]) {
    localStorageService.set(STORAGE_KEYS.usuarios, list);
  }
  private readSessao(): SessaoUsuario | null {
    return localStorageService.get<SessaoUsuario>(STORAGE_KEYS.sessao);
  }
  private writeSessao(s: SessaoUsuario | null) {
    if (s) localStorageService.set(STORAGE_KEYS.sessao, s);
    else localStorageService.remove(STORAGE_KEYS.sessao);
  }
  private emit(evento: EventoAutenticacao, sessao: SessaoUsuario | null) {
    this.listeners.forEach((l) => l(evento, sessao));
  }
  private toUsuario(p: UsuarioPersistido): Usuario {
    return { id: p.id, email: p.email, nome: p.nome };
  }
  private criarSessao(p: UsuarioPersistido): SessaoUsuario {
    return {
      usuario: this.toUsuario(p),
      accessToken: `local-${p.id}-${Date.now()}`,
      expiraEm: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30,
    };
  }

  async obterSessao(): Promise<SessaoUsuario | null> {
    return this.readSessao();
  }

  onMudancaSessao(cb: Callback): () => void {
    this.listeners.add(cb);
    // emite sessão atual imediatamente, espelhando comportamento de auth listeners
    queueMicrotask(() => cb("INITIAL_SESSION", this.readSessao()));
    return () => {
      this.listeners.delete(cb);
    };
  }

  async ehAdmin(usuarioId: string): Promise<boolean> {
    return !!this.readUsuarios().find((u) => u.id === usuarioId)?.admin;
  }

  async login(payload: LoginRequest): Promise<void> {
    const usuarios = this.readUsuarios();
    const u = usuarios.find(
      (x) => x.email.toLowerCase() === payload.email.toLowerCase() && x.senha === payload.senha,
    );
    if (!u) throw new Error("E-mail ou senha inválidos");
    const sessao = this.criarSessao(u);
    this.writeSessao(sessao);
    this.emit("SIGNED_IN", sessao);
  }

  async loginGoogle(_payload: LoginGoogleRequest): Promise<void> {
    throw new Error("Login com Google estará disponível após integração com o backend.");
  }

  async cadastrar(payload: CadastroRequest): Promise<void> {
    const usuarios = this.readUsuarios();
    if (usuarios.some((u) => u.email.toLowerCase() === payload.email.toLowerCase())) {
      throw new Error("Já existe uma conta com este e-mail");
    }
    const isFirst = usuarios.length === 0;
    const novo: UsuarioPersistido = {
      id: crypto.randomUUID(),
      nome: payload.nome.trim(),
      email: payload.email.trim(),
      senha: payload.senha,
      admin: isFirst,
    };
    usuarios.push(novo);
    this.writeUsuarios(usuarios);
    const sessao = this.criarSessao(novo);
    this.writeSessao(sessao);
    this.emit("SIGNED_IN", sessao);
  }

  async recuperarSenha(_payload: RecuperarSenhaRequest): Promise<void> {
    // Sem backend para enviar e-mail; apenas finge sucesso para manter UX.
    return;
  }

  async redefinirSenha(payload: NovaSenhaRequest): Promise<void> {
    const sessao = this.readSessao();
    if (!sessao) throw new Error("Sessão não encontrada");
    const usuarios = this.readUsuarios();
    const idx = usuarios.findIndex((u) => u.id === sessao.usuario.id);
    if (idx < 0) throw new Error("Usuário não encontrado");
    usuarios[idx] = { ...usuarios[idx], senha: payload.senha };
    this.writeUsuarios(usuarios);
    this.emit("USER_UPDATED", sessao);
  }

  async sair(): Promise<void> {
    this.writeSessao(null);
    this.emit("SIGNED_OUT", null);
  }
}
