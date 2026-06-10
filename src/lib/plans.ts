/**
 * Fonte única de verdade dos planos: preço, limites do grátis e o catálogo
 * de features exibido na página "Meu plano" e na landing. Ajuste os números
 * aqui — todo o gating e a UI leem deste arquivo.
 *
 * Mantém-se client-safe (sem segredos / sem env de servidor): as credenciais
 * do Mercado Pago ficam em variáveis de ambiente lidas no servidor.
 */

export type PlanId = "free" | "premium";

/**
 * Premium é compra única (lifetime) via Mercado Pago — sem recorrência.
 * `full` é o preço cheio (âncora exibida riscada na UI); `launch` é o valor
 * cobrado no checkout enquanto durar a oferta de lançamento.
 */
export const LIFETIME_PRICE = {
  launch: 99.9,
  full: 199.9,
  /** Título do item no checkout do Mercado Pago. */
  title: "Dezena Premium — acesso vitalício",
};

/** Limites aplicados a quem está no plano grátis. */
export const FREE_LIMITS = {
  /** Gerações por dia (usuário logado no grátis). */
  generationsPerDay: 3,
  /** Jogos gerados por requisição no grátis. */
  gamesPerGeneration: 3,
  /** Máximo de jogos salvos no grátis. */
  savedGames: 5,
};

/** Quantos jogos o Premium pode gerar por requisição (geração em lote). */
export const PREMIUM_GAMES_PER_GENERATION = 20;

export interface PlanFeature {
  label: string;
  /** `true`/`false` ou um rótulo curto (ex.: "até 5"). */
  free: boolean | string;
  premium: boolean | string;
}

/** Comparativo grátis × Premium. A análise fica 100% no grátis, por filosofia. */
export const PLAN_FEATURES: PlanFeature[] = [
  { label: "Análises estatísticas completas", free: true, premium: true },
  { label: "Tabela de concursos e histórico", free: true, premium: true },
  {
    label: "Geração de jogos",
    free: `${FREE_LIMITS.generationsPerDay}/dia`,
    premium: "ilimitada + em lote",
  },
  {
    label: "Jogos salvos",
    free: `até ${FREE_LIMITS.savedGames}`,
    premium: "ilimitados",
  },
  { label: "Fechamentos (wheeling)", free: false, premium: true },
  {
    label: "Avaliador automático e acompanhamento de prêmios",
    free: false,
    premium: true,
  },
];

export function formatBRL(amount: number): string {
  return amount.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

/** Desconto da oferta de lançamento sobre o preço cheio (em %). */
export function launchDiscountPct(): number {
  return Math.round((1 - LIFETIME_PRICE.launch / LIFETIME_PRICE.full) * 100);
}
