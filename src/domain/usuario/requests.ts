export interface LoginRequest {
  email: string;
  senha: string;
}

export interface CadastroRequest {
  nome: string;
  email: string;
  senha: string;
  redirectUrl: string;
}

export interface RecuperarSenhaRequest {
  email: string;
  redirectUrl: string;
}

export interface NovaSenhaRequest {
  senha: string;
}

export interface LoginGoogleRequest {
  redirectUrl: string;
}
