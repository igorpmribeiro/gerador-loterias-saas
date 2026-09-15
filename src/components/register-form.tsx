"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Crown, ShieldCheck } from "lucide-react";
import { signUp } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SocialButtons } from "@/components/social-buttons";
import { REFUND_DAYS } from "@/lib/legal";
import { FREE_LIMITS, LIFETIME_PRICE, formatBRL } from "@/lib/plans";

/**
 * Cadastro. O formulário é o mesmo nos dois caminhos, mas a moldura muda com
 * a intenção: quem clicou em "Quero o Premium vitalício" chega aqui decidido
 * a pagar e precisa ver o que comprou, quanto custa e a garantia — antes a
 * tela falava só em "salvar jogos", a feature mais fraca do catálogo.
 */
export function RegisterForm({ plan }: { plan: "free" | "premium" }) {
  const router = useRouter();
  const premium = plan === "premium";
  const destination = premium ? "/meu-plano" : "/painel";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const { error: err } = await signUp.email({ name, email, password });

    if (err) {
      setError(err.message ?? "Não foi possível criar a conta. Tente de novo.");
      setSubmitting(false);
      return;
    }

    router.push(destination);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          {premium ? "Criar conta e ativar o Premium" : "Criar conta grátis"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {premium
            ? "Primeiro a conta, depois o pagamento — leva menos de um minuto."
            : `Em 30 segundos você gera seus ${FREE_LIMITS.generationsPerDay * FREE_LIMITS.gamesPerGeneration} primeiros jogos. Sem cartão.`}
        </p>
      </div>

      {premium && (
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="flex items-center gap-1.5 text-sm font-medium">
                <Crown aria-hidden className="size-4 text-brand-strong" />
                Premium vitalício
              </p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Pagamento único · Pix, boleto ou cartão
              </p>
            </div>
            <p className="shrink-0 font-mono text-lg font-medium tnum">
              {formatBRL(LIFETIME_PRICE.launch)}
            </p>
          </div>
          <p className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
            <ShieldCheck
              aria-hidden
              className="mt-0.5 size-3.5 shrink-0 text-brand-strong"
            />
            <span>
              {REFUND_DAYS} dias para desistir e receber 100% de volta. Sem
              mensalidade e sem renovação automática.
            </span>
          </p>
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Como podemos te chamar?</Label>
          <Input
            id="name"
            type="text"
            autoComplete="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Senha</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">Mínimo de 8 caracteres.</p>
        </div>

        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}

        <Button type="submit" size="lg" className="w-full" disabled={submitting}>
          {submitting
            ? "Criando conta..."
            : premium
              ? "Criar conta e ir para o pagamento"
              : "Criar conta grátis"}
        </Button>

        <SocialButtons callbackURL={destination} />
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Já tem conta?{" "}
        <Link
          href="/login"
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Entrar
        </Link>
      </p>

      <p className="text-center text-xs leading-relaxed text-muted-foreground">
        Ao criar a conta você concorda com os{" "}
        <Link href="/termos" className="underline underline-offset-4 hover:text-foreground">
          Termos de Uso
        </Link>{" "}
        e a{" "}
        <Link
          href="/privacidade"
          className="underline underline-offset-4 hover:text-foreground"
        >
          Política de Privacidade
        </Link>
        .
      </p>
    </div>
  );
}
