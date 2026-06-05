/**
 * Configuração centralizada da API.
 *
 * Esta é a ÚNICA fonte de configuração de URLs/endpoints da aplicação.
 * Não usar variáveis de ambiente (import.meta.env, process.env, VITE_*)
 * em código de aplicação. A URL será fornecida pelo BFF no futuro.
 */
export const ApiConfig = {
  /** Base URL do BFF. Será preenchida quando o backend HTTP estiver disponível. */
  baseUrl: "",
  /** Timeout padrão das chamadas HTTP (ms). */
  timeoutMs: 15000,
} as const;
