"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, Crown, Minus, Sparkles } from "lucide-react";
import { PageHeader } from "./page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useApiResource } from "@/hooks/use-api-resource";
import {
  LIFETIME_PRICE,
  PLAN_FEATURES,
  formatBRL,
  launchDiscountPct,
  type PlanFeature,
} from "@/lib/plans";

interface SubscriptionState {
  plan: "free" | "premium";
  status: string | null;
  billing: string | null;
  currentPeriodEnd: string | null;
  usage: { generationsToday: number; savedGames: number };
  limits: { generationsPerDay: number; gamesPerGeneration: number; savedGames: number };
}

export function PlanView() {
  const { data, loading, error, reload } =
    useApiResource<SubscriptionState>("/api/subscription");

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Meu plano"
        description="Gerencie seu plano e veja o uso."
      />

      <PaymentReturnBanner onReload={reload} />

      {loading && (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Carregando seu plano...
          </CardContent>
        </Card>
      )}

      {error && !loading && (
        <Card className="border-destructive/30">
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="outline" size="sm" onClick={reload}>
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      )}

      {data && !loading && (
        <>
          <CurrentPlanCard data={data} />
          {data.plan === "free" ? (
            <>
              <UsageCard data={data} />
              <UpgradeCard onSubscribed={reload} />
            </>
          ) : (
            <PremiumPerksCard />
          )}
          <p className="px-1 text-[11px] leading-relaxed text-muted-foreground">
            As análises são estatísticas sobre sorteios passados. Loteria é jogo
            de azar — nenhuma ferramenta aumenta sua chance real de ganhar. O
            Premium entrega mais dados e automação, não previsões.
          </p>
        </>
      )}
    </div>
  );
}

/**
 * Banner exibido na volta do Checkout Pro (back_urls → /meu-plano?payment=...).
 * A liberação real vem do webhook, então "success" pede um reload do estado.
 */
function PaymentReturnBanner({ onReload }: { onReload: () => void }) {
  const kind = useSearchParams().get("payment");
  const router = useRouter();

  if (!kind) return null;

  if (kind === "success") {
    return (
      <Card className="border-emerald-500/40 bg-emerald-500/5">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
          <p className="text-sm">
            <strong className="font-medium">Pagamento aprovado!</strong>{" "}
            Estamos confirmando com o Mercado Pago — seu acesso vitalício é
            liberado em instantes.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              onReload();
              router.replace("/meu-plano");
            }}
          >
            Atualizar status
          </Button>
        </CardContent>
      </Card>
    );
  }
  if (kind === "pending") {
    return (
      <Card className="border-amber-500/40 bg-amber-500/5">
        <CardContent className="py-4 text-sm">
          <strong className="font-medium">Pagamento em processamento.</strong>{" "}
          Pix e boleto podem levar alguns instantes — seu acesso é liberado
          automaticamente assim que o Mercado Pago confirmar.
        </CardContent>
      </Card>
    );
  }
  return (
    <Card className="border-destructive/30 bg-destructive/5">
      <CardContent className="py-4 text-sm">
        <strong className="font-medium">Pagamento não concluído.</strong> Nada
        foi cobrado — você pode tentar novamente quando quiser.
      </CardContent>
    </Card>
  );
}

function CurrentPlanCard({ data }: { data: SubscriptionState }) {
  const isPremium = data.plan === "premium";
  const premiumDescription =
    data.billing === "lifetime" || !data.currentPeriodEnd
      ? "Acesso vitalício — pagamento único, sem mensalidade."
      : `Acesso ativo até ${new Date(data.currentPeriodEnd).toLocaleDateString("pt-BR")}`;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              {isPremium ? "Plano Premium" : "Plano Grátis"}
              <Badge variant={isPremium ? "success" : "secondary"}>
                {isPremium ? (
                  <>
                    <Crown className="size-3" /> Premium
                  </>
                ) : (
                  "Grátis"
                )}
              </Badge>
            </CardTitle>
            <CardDescription>
              {isPremium
                ? premiumDescription
                : "Você está no plano grátis com acesso total às análises."}
            </CardDescription>
          </div>
          <Crown
            className={
              isPremium
                ? "size-5 text-emerald-500"
                : "size-5 text-muted-foreground"
            }
          />
        </div>
      </CardHeader>
    </Card>
  );
}

function UsageBar({
  label,
  used,
  total,
}: {
  label: string;
  used: number;
  total: number;
}) {
  const pct = total > 0 ? Math.min(100, (used / total) * 100) : 0;
  const atLimit = used >= total;
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span>{label}</span>
        <span
          className={
            atLimit ? "font-medium text-amber-600 dark:text-amber-400" : "text-muted-foreground"
          }
        >
          {used} / {total}
        </span>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-secondary">
        <div
          className={
            "h-full rounded-full " + (atLimit ? "bg-amber-500" : "bg-primary")
          }
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function UsageCard({ data }: { data: SubscriptionState }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Seu uso hoje</CardTitle>
        <CardDescription>
          Limites do plano grátis. O Premium libera tudo sem limite.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <UsageBar
          label="Gerações de jogos (hoje)"
          used={data.usage.generationsToday}
          total={data.limits.generationsPerDay}
        />
        <UsageBar
          label="Jogos salvos"
          used={data.usage.savedGames}
          total={data.limits.savedGames}
        />
      </CardContent>
    </Card>
  );
}

function FeatureValue({ value }: { value: boolean | string }) {
  if (value === true)
    return <Check className="size-4 text-emerald-500" strokeWidth={2.5} />;
  if (value === false)
    return <Minus className="size-4 text-muted-foreground/50" />;
  return <span className="text-xs font-medium">{value}</span>;
}

function FeatureRow({ feature }: { feature: PlanFeature }) {
  return (
    <div className="grid grid-cols-[1fr_auto_auto] items-center gap-3 py-2 text-sm">
      <span className="text-muted-foreground">{feature.label}</span>
      <span className="flex w-16 justify-center">
        <FeatureValue value={feature.free} />
      </span>
      <span className="flex w-24 justify-center">
        <FeatureValue value={feature.premium} />
      </span>
    </div>
  );
}

function UpgradeCard({ onSubscribed }: { onSubscribed: () => void }) {
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  async function subscribe() {
    setSubmitting(true);
    setNotice(null);
    try {
      const res = await fetch("/api/subscription/checkout", {
        method: "POST",
      });
      const json = await res.json();
      if (res.ok && json.initPoint) {
        window.location.href = json.initPoint as string;
        return;
      }
      if (res.ok && json.status === "active") {
        onSubscribed();
        return;
      }
      setNotice(json.error ?? "não foi possível iniciar o checkout");
    } catch {
      setNotice("erro de conexão — tente novamente");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="border-primary/30">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="size-5 text-primary" />
              Premium vitalício
            </CardTitle>
            <CardDescription>
              Pague uma vez, use para sempre: fechamentos, avaliador automático
              e geração sem limite.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {/* Preço: âncora riscada + oferta de lançamento */}
        <div>
          <div className="flex items-end gap-2">
            <span className="text-sm text-muted-foreground line-through">
              {formatBRL(LIFETIME_PRICE.full)}
            </span>
            <Badge variant="success">
              oferta de lançamento −{launchDiscountPct()}%
            </Badge>
          </div>
          <div className="mt-1 flex items-end gap-1">
            <span className="text-3xl font-semibold tracking-tight">
              {formatBRL(LIFETIME_PRICE.launch)}
            </span>
            <span className="pb-1 text-sm text-muted-foreground">
              pagamento único
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Pix, boleto ou cartão — parcele no cartão pelo Mercado Pago (com os
            juros da operadora).
          </p>
        </div>

        <Separator />

        {/* Comparativo */}
        <div>
          <div className="grid grid-cols-[1fr_auto_auto] gap-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <span>Recurso</span>
            <span className="flex w-16 justify-center">Grátis</span>
            <span className="flex w-24 justify-center">Premium</span>
          </div>
          <Separator />
          <div className="divide-y">
            {PLAN_FEATURES.map((f) => (
              <FeatureRow key={f.label} feature={f} />
            ))}
          </div>
        </div>

        {notice && (
          <p
            className="rounded-md bg-secondary px-3 py-2 text-sm text-muted-foreground"
            role="status"
          >
            {notice}
          </p>
        )}

        <Button size="lg" onClick={subscribe} disabled={submitting}>
          <Crown className="size-4" />
          {submitting
            ? "Abrindo checkout..."
            : `Garantir acesso vitalício — ${formatBRL(LIFETIME_PRICE.launch)}`}
        </Button>
        <p className="text-center text-[11px] text-muted-foreground">
          Pagamento único e seguro via Mercado Pago. Sem mensalidade, sem
          renovação.
        </p>
      </CardContent>
    </Card>
  );
}

function PremiumPerksCard() {
  return (
    <Card className="border-emerald-500/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="size-5 text-emerald-500" />
          Tudo liberado
        </CardTitle>
        <CardDescription>
          Você tem acesso a todos os recursos da plataforma.
        </CardDescription>
      </CardHeader>
      <CardContent className="divide-y">
        {PLAN_FEATURES.map((f) => (
          <div
            key={f.label}
            className="flex items-center gap-3 py-2 text-sm"
          >
            <Check className="size-4 shrink-0 text-emerald-500" strokeWidth={2.5} />
            <span>{f.label}</span>
            {typeof f.premium === "string" && (
              <span className="ml-auto text-xs text-muted-foreground">
                {f.premium}
              </span>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
