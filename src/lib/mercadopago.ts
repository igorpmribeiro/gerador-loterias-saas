import { createHmac, timingSafeEqual } from "node:crypto";
import { LIFETIME_PRICE } from "./plans";

/**
 * Integração mínima com o Mercado Pago para PAGAMENTO ÚNICO (Checkout Pro):
 * cria a preference, consulta o pagamento e valida a assinatura do webhook.
 * Sem SDK e sem assinaturas/preapproval — a recorrência foi descartada de
 * propósito (fluxo complexo demais); não reintroduzir.
 */

const API_BASE = "https://api.mercadopago.com";

function accessToken(): string {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!token) {
    throw new Error("MERCADOPAGO_ACCESS_TOKEN não configurado");
  }
  return token;
}

export interface CheckoutPreference {
  id: string;
  /** URL do Checkout Pro para redirecionar o comprador. */
  initPoint: string;
}

/**
 * Cria a preference da compra vitalícia. O parcelamento fica disponível no
 * checkout com juros por conta do comprador (comportamento padrão do MP —
 * parcela sem juros só se ativada no painel do vendedor, o que não fazemos).
 */
export async function createLifetimePreference(opts: {
  userId: string;
  userEmail: string;
  /** Origem pública do app (ex.: https://dezena.app). */
  baseUrl: string;
}): Promise<CheckoutPreference> {
  const isHttps = opts.baseUrl.startsWith("https://");
  const res = await fetch(`${API_BASE}/checkout/preferences`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      items: [
        {
          id: "premium-lifetime",
          title: LIFETIME_PRICE.title,
          description: "Acesso vitalício ao plano Premium do Dezena",
          category_id: "services",
          quantity: 1,
          currency_id: "BRL",
          unit_price: LIFETIME_PRICE.launch,
        },
      ],
      payer: { email: opts.userEmail },
      // Chave que liga o pagamento ao usuário quando o webhook chegar.
      external_reference: opts.userId,
      back_urls: {
        success: `${opts.baseUrl}/meu-plano?payment=success`,
        pending: `${opts.baseUrl}/meu-plano?payment=pending`,
        failure: `${opts.baseUrl}/meu-plano?payment=failure`,
      },
      // auto_return exige URL pública https — em dev (localhost) é omitido.
      ...(isHttps ? { auto_return: "approved" } : {}),
      notification_url: isHttps
        ? `${opts.baseUrl}/api/webhooks/mercadopago`
        : undefined,
      statement_descriptor: "DEZENA",
    }),
    signal: AbortSignal.timeout(15_000),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(
      `Mercado Pago: HTTP ${res.status} ao criar preferência${
        detail ? ` — ${detail.slice(0, 300)}` : ""
      }`
    );
  }

  const json = (await res.json()) as { id: string; init_point: string };
  return { id: json.id, initPoint: json.init_point };
}

export interface MpPayment {
  id: number;
  /** approved | pending | in_process | rejected | cancelled | refunded | charged_back */
  status: string;
  /** O userId que enviamos como external_reference na preference. */
  externalReference: string | null;
}

/** Consulta um pagamento na API do MP — a fonte de verdade do webhook. */
export async function getPayment(paymentId: string): Promise<MpPayment | null> {
  const res = await fetch(`${API_BASE}/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${accessToken()}` },
    signal: AbortSignal.timeout(15_000),
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`Mercado Pago: HTTP ${res.status} ao consultar pagamento`);
  }
  const json = (await res.json()) as {
    id: number;
    status: string;
    external_reference?: string | null;
  };
  return {
    id: json.id,
    status: json.status,
    externalReference: json.external_reference ?? null,
  };
}

/**
 * Valida o header `x-signature` dos webhooks do MP.
 * Manifest documentado: `id:[data.id];request-id:[x-request-id];ts:[ts];`
 * (partes ausentes são omitidas), HMAC-SHA256 hex com o segredo do webhook.
 */
export function verifyWebhookSignature(params: {
  xSignature: string | null;
  xRequestId: string | null;
  /** Query param `data.id` da URL de notificação. */
  dataId: string | null;
}): boolean {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (!secret || !params.xSignature) return false;

  const parts = new Map<string, string>();
  for (const piece of params.xSignature.split(",")) {
    const idx = piece.indexOf("=");
    if (idx > 0) {
      parts.set(piece.slice(0, idx).trim(), piece.slice(idx + 1).trim());
    }
  }
  const ts = parts.get("ts");
  const v1 = parts.get("v1");
  if (!ts || !v1) return false;

  let manifest = "";
  if (params.dataId) manifest += `id:${params.dataId.toLowerCase()};`;
  if (params.xRequestId) manifest += `request-id:${params.xRequestId};`;
  manifest += `ts:${ts};`;

  const digest = createHmac("sha256", secret).update(manifest).digest("hex");
  const a = Buffer.from(digest);
  const b = Buffer.from(v1);
  return a.length === b.length && timingSafeEqual(a, b);
}
