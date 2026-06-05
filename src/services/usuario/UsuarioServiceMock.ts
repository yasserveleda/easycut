import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import type { Session } from "@supabase/supabase-js";
import type { EventoAutenticacao, SessaoUsuario } from "@/domain/usuario/Usuario";
import type {
  CadastroRequest,
  LoginGoogleRequest,
  LoginRequest,
  NovaSenhaRequest,
  RecuperarSenhaRequest,
} from "@/domain/usuario/requests";
import type { IUsuarioService } from "./IUsuarioService";

function toSessao(s: Session | null): SessaoUsuario | null {
  if (!s) return null;
  return {
    usuario: {
      id: s.user.id,
      email: s.user.email ?? null,
      nome:
        (s.user.user_metadata?.full_name as string | undefined) ??
        (s.user.user_metadata?.name as string | undefined),
    },
    accessToken: s.access_token,
    expiraEm: s.expires_at,
  };
}

export class UsuarioServiceMock implements IUsuarioService {
  async obterSessao(): Promise<SessaoUsuario | null> {
    const { data } = await supabase.auth.getSession();
    return toSessao(data.session);
  }

  onMudancaSessao(
    cb: (evento: EventoAutenticacao, sessao: SessaoUsuario | null) => void,
  ): () => void {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      cb(event as EventoAutenticacao, toSessao(session));
    });
    return () => subscription.unsubscribe();
  }

  async ehAdmin(usuarioId: string): Promise<boolean> {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", usuarioId)
      .eq("role", "admin")
      .maybeSingle();
    return !!data;
  }

  async login(payload: LoginRequest): Promise<void> {
    const { error } = await supabase.auth.signInWithPassword({
      email: payload.email,
      password: payload.senha,
    });
    if (error) throw new Error(error.message);
  }

  async loginGoogle(payload: LoginGoogleRequest): Promise<void> {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: payload.redirectUrl });
    if (r.error) throw new Error("Falha ao entrar com Google");
  }

  async cadastrar(payload: CadastroRequest): Promise<void> {
    const { error } = await supabase.auth.signUp({
      email: payload.email,
      password: payload.senha,
      options: { emailRedirectTo: payload.redirectUrl, data: { full_name: payload.nome } },
    });
    if (error) throw new Error(error.message);
  }

  async recuperarSenha(payload: RecuperarSenhaRequest): Promise<void> {
    const { error } = await supabase.auth.resetPasswordForEmail(payload.email, {
      redirectTo: payload.redirectUrl,
    });
    if (error) throw new Error(error.message);
  }

  async redefinirSenha(payload: NovaSenhaRequest): Promise<void> {
    const { error } = await supabase.auth.updateUser({ password: payload.senha });
    if (error) throw new Error(error.message);
  }

  async sair(): Promise<void> {
    await supabase.auth.signOut();
  }
}
