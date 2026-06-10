import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth-server";
import { isPremium } from "@/lib/subscriptions";
import { createLifetimePreference } from "@/lib/mercadopago";
import { checkRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Inicia a compra do Premium vitalício (pagamento único via Mercado Pago).
 * Cria a preference do Checkout Pro e devolve a URL em `initPoint` para a UI
 * redirecionar. A confirmação chega pelo webhook (/api/webhooks/mercadopago).
 */
export async function POST(req: NextRequest) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json(
      { error: "entre na sua conta para assinar" },
      { status: 401 }
    );
  }

  if (await isPremium(session.user.id)) {
    return NextResponse.json({ status: "active" });
  }

  if (
    !(await checkRateLimit(`checkout:${session.user.id}`, {
      window: 60,
      max: 5,
    }))
  ) {
    return NextResponse.json(
      { error: "muitas tentativas — aguarde um minuto" },
      { status: 429 }
    );
  }

  const baseUrl = process.env.BETTER_AUTH_URL ?? new URL(req.url).origin;

  try {
    const pref = await createLifetimePreference({
      userId: session.user.id,
      userEmail: session.user.email,
      baseUrl,
    });
    return NextResponse.json({ initPoint: pref.initPoint });
  } catch (err) {
    console.error("checkout: falha ao criar preference", err);
    return NextResponse.json(
      { error: "não foi possível iniciar o checkout — tente novamente" },
      { status: 502 }
    );
  }
}
