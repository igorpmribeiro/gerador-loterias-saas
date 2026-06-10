import { one, run } from "./db";

export type SubscriptionStatus =
  | "active"
  | "pending"
  | "paused"
  | "cancelled"
  | "expired";

/** Modalidade de cobrança registrada na compra ("lifetime" = pagamento único). */
export type BillingKind = "lifetime";

export interface Subscription {
  userId: string;
  plan: "premium";
  status: SubscriptionStatus;
  providerSubscriptionId: string | null;
  billing: BillingKind | null;
  /**
   * ISO da data até quando o período pago é válido.
   * `null` = sem expiração (compra lifetime).
   */
  currentPeriodEnd: string | null;
  createdAt: string;
  updatedAt: string;
}

interface SubRow {
  user_id: string;
  plan: string;
  status: string;
  provider_subscription_id: string | null;
  billing: string | null;
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
}

function rowToSub(r: SubRow): Subscription {
  return {
    userId: r.user_id,
    plan: "premium",
    status: r.status as SubscriptionStatus,
    providerSubscriptionId: r.provider_subscription_id,
    billing: (r.billing as BillingKind | null) ?? null,
    currentPeriodEnd: r.current_period_end,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export async function getSubscription(
  userId: string
): Promise<Subscription | null> {
  const row = await one<SubRow>(
    `SELECT * FROM subscriptions WHERE user_id = ?`,
    [userId]
  );
  return row ? rowToSub(row) : null;
}

/** Assinatura efetivamente ativa: status `active` e período não expirado. */
export async function getActiveSubscription(
  userId: string
): Promise<Subscription | null> {
  const sub = await getSubscription(userId);
  if (!sub || sub.status !== "active") return null;
  if (
    sub.currentPeriodEnd &&
    new Date(sub.currentPeriodEnd).getTime() < Date.now()
  ) {
    return null;
  }
  return sub;
}

export async function isPremium(userId: string): Promise<boolean> {
  return (await getActiveSubscription(userId)) !== null;
}

export interface UpsertSubscriptionInput {
  userId: string;
  status: SubscriptionStatus;
  providerSubscriptionId?: string | null;
  billing?: BillingKind | null;
  currentPeriodEnd?: string | null;
}

/**
 * Cria ou atualiza a assinatura de um usuário (chamado pelo webhook do provedor
 * de pagamento). Campos opcionais ausentes preservam o valor atual.
 */
export async function upsertSubscription(
  input: UpsertSubscriptionInput
): Promise<void> {
  const now = new Date().toISOString();
  await run(
    `INSERT INTO subscriptions
       (user_id, plan, status, provider_subscription_id, billing,
        current_period_end, created_at, updated_at)
     VALUES (?, 'premium', ?, ?, ?, ?, ?, ?)
     ON CONFLICT(user_id) DO UPDATE SET
       status             = excluded.status,
       provider_subscription_id  = COALESCE(excluded.provider_subscription_id, subscriptions.provider_subscription_id),
       billing            = COALESCE(excluded.billing, subscriptions.billing),
       current_period_end = COALESCE(excluded.current_period_end, subscriptions.current_period_end),
       updated_at         = excluded.updated_at`,
    [
      input.userId,
      input.status,
      input.providerSubscriptionId ?? null,
      input.billing ?? null,
      input.currentPeriodEnd ?? null,
      now,
      now,
    ]
  );
}

/** Erro de gating: o recurso exige plano Premium ativo. */
export class PaymentRequiredError extends Error {
  constructor(message = "recurso exclusivo do plano Premium") {
    super(message);
    this.name = "PaymentRequiredError";
  }
}
