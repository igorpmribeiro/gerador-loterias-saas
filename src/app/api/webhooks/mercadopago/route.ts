import { NextRequest, NextResponse } from "next/server";
import { getPayment, verifyWebhookSignature } from "@/lib/mercadopago";
import {
  getSubscription,
  upsertSubscription,
  type SubscriptionStatus,
} from "@/lib/subscriptions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Webhook de pagamentos do Mercado Pago (compra única do Premium vitalício).
 *
 * Segurança em duas camadas: valida o header `x-signature` (HMAC com o
 * segredo do webhook) e, mesmo assim, NUNCA confia no corpo da notificação —
 * o estado vem de `getPayment` na API do MP, com nosso access token.
 *
 * Responde 200 para notificações irrelevantes (outros tópicos, pagamento
 * inexistente): qualquer outra resposta faz o MP reenfileirar retries.
 */
export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  const dataId =
    url.searchParams.get("data.id") ?? url.searchParams.get("id");
  const type = url.searchParams.get("type") ?? url.searchParams.get("topic");

  const signed = verifyWebhookSignature({
    xSignature: req.headers.get("x-signature"),
    xRequestId: req.headers.get("x-request-id"),
    dataId,
  });
  if (!signed) {
    // Sem segredo configurado ou assinatura inválida: rejeita em produção;
    // em dev (testes locais com curl) segue sem validar.
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { error: "assinatura inválida" },
        { status: 401 }
      );
    }
  }

  if (type !== "payment" || !dataId) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  let payment;
  try {
    payment = await getPayment(dataId);
  } catch (err) {
    console.error("webhook mp: falha ao consultar pagamento", err);
    // 502 → o MP reenvia depois; melhor do que perder a notificação.
    return NextResponse.json({ error: "erro ao consultar" }, { status: 502 });
  }

  if (!payment?.externalReference) {
    return NextResponse.json({ ok: true, ignored: true });
  }
  const userId = payment.externalReference;

  // Mapeia o status do pagamento para o status da "assinatura" lifetime.
  let status: SubscriptionStatus | null = null;
  switch (payment.status) {
    case "approved":
      status = "active";
      break;
    case "pending":
    case "in_process":
    case "authorized":
      status = "pending";
      break;
    case "refunded":
    case "charged_back":
      status = "cancelled";
      break;
    default:
      // rejected/cancelled de uma TENTATIVA não mexe no plano do usuário.
      status = null;
  }
  if (!status) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  // Nunca rebaixa um lifetime ativo por causa de uma segunda tentativa
  // pendente; estorno/chargeback (cancelled) passa e revoga o acesso.
  if (status === "pending") {
    const current = await getSubscription(userId);
    if (current?.status === "active") {
      return NextResponse.json({ ok: true, ignored: true });
    }
  }

  await upsertSubscription({
    userId,
    status,
    providerSubscriptionId: String(payment.id),
    billing: "lifetime",
    currentPeriodEnd: null, // lifetime: sem expiração
  });

  return NextResponse.json({ ok: true });
}
