/**
 * Identificação legal e canais de contato — fonte única para rodapé, Termos
 * de Uso e Política de Privacidade.
 *
 * `legalName` e `cnpj` nascem vazios de propósito: exibir um dado societário
 * inventado é pior do que não exibir nenhum. Os componentes só renderizam
 * essas linhas quando elas estão preenchidas, então dá para publicar hoje e
 * completar depois sem tocar em nenhuma tela.
 */
export const COMPANY = {
  /** Nome comercial — o que aparece para o usuário. */
  brand: "Dezena",
  /** Razão social. Preencher quando houver PJ (ex.: "Fulano Tecnologia LTDA"). */
  legalName: "",
  /** CNPJ formatado (ex.: "00.000.000/0001-00"). Vazio = linha não aparece. */
  cnpj: "",
  /** Cidade/UF de foro e de atendimento. */
  location: "",
  /** Canal de suporte e de exercício de direitos da LGPD. */
  supportEmail: "contato@dezena.app.br",
  site: "https://www.dezena.app.br",
} as const;

/** Prazo de arrependimento (CDC art. 49). Não reduzir: é piso legal. */
export const REFUND_DAYS = 7;

/** Última revisão dos documentos legais (ISO). Exibida no topo de cada um. */
export const LEGAL_UPDATED_AT = "2026-09-15";

/** Sub-processadores citados na Política de Privacidade. */
export const PROCESSORS = [
  {
    name: "Mercado Pago",
    role: "Processamento do pagamento único do Premium",
    note: "Os dados do cartão são digitados no ambiente do Mercado Pago e nunca passam pelos nossos servidores.",
  },
  {
    name: "Vercel",
    role: "Hospedagem da aplicação e logs de acesso",
    note: "Registra endereço IP e dados técnicos da requisição pelo tempo necessário à segurança do serviço.",
  },
  {
    name: "Turso",
    role: "Banco de dados",
    note: "Armazena conta, jogos salvos, uso diário e status do plano.",
  },
  {
    name: "Google",
    role: "Login com conta Google (opcional)",
    note: "Usado apenas se você escolher entrar com o Google; recebemos nome, e-mail e foto de perfil.",
  },
  {
    name: "Caixa Econômica Federal",
    role: "Origem dos resultados",
    note: "Consultamos a API pública de loterias. Nenhum dado seu é enviado à Caixa.",
  },
] as const;

/** Formata a data ISO de revisão para exibição (dd/mm/aaaa). */
export function legalUpdatedLabel(): string {
  const [y, m, d] = LEGAL_UPDATED_AT.split("-");
  return `${d}/${m}/${y}`;
}
