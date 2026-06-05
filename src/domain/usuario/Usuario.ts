export interface Usuario {
  id: string;
  email: string | null;
  nome?: string;
}

export interface SessaoUsuario {
  usuario: Usuario;
  accessToken: string;
  expiraEm?: number;
}

export type EventoAutenticacao =
  | "SIGNED_IN"
  | "SIGNED_OUT"
  | "TOKEN_REFRESHED"
  | "USER_UPDATED"
  | "PASSWORD_RECOVERY"
  | "INITIAL_SESSION";
