import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  ChartColumnBig,
  ClipboardCheck,
  Crown,
  Database,
  Dices,
  History,
  Layers,
  Check,
  Minus,
} from "lucide-react";
import { Brand } from "@/components/brand";
import { LandingNav } from "@/components/landing-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  LIFETIME_PRICE,
  PLAN_FEATURES,
  formatBRL,
  launchDiscountPct,
  type PlanFeature,
} from "@/lib/plans";

export const metadata: Metadata = {
  title: "Dezena — Análise estatística e geração para Mega-Sena e Lotofácil",
  description:
    "Análises estatísticas completas, geração de jogos com ML e fechamentos para Mega-Sena e Lotofácil. Dados 100% oficiais da Caixa. Faça sua própria sorte com dados.",
};

const FEATURES = [
  {
    icon: ChartColumnBig,
    title: "Análises estatísticas completas",
    desc: "Frequência, atraso, pares/ímpares, soma, ciclos e afinidade entre dezenas — tabelas e gráficos densos para você interpretar.",
  },
  {
    icon: Dices,
    title: "Geração com ML",
    desc: "Modelos treinados sobre todo o histórico geram jogos por estratégia (quentes, atrasados, balanceados) — não palpite aleatório.",
  },
  {
    icon: Layers,
    title: "Fechamentos (wheeling)",
    desc: "Monte desdobramentos com garantia matemática de acerto e veja o custo de cada esquema antes de apostar.",
  },
  {
    icon: ClipboardCheck,
    title: "Avaliador automático",
    desc: "Confira seus jogos contra os sorteios, acompanhe acertos e prêmios ao longo do tempo sem planilha.",
  },
  {
    icon: History,
    title: "Histórico e performance",
    desc: "Salve teimosinhas, marque concursos e acompanhe a evolução dos seus jogos concurso a concurso.",
  },
  {
    icon: Database,
    title: "Dados oficiais da Caixa",
    desc: "Todos os resultados vêm direto da API oficial da Caixa, sempre atualizados — nada de planilha desatualizada.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <LandingHeader />
      <main className="flex-1">
        <Hero />
        <TrustStrip />
        <Features />
        <Pricing />
        <Disclaimer />
      </main>
      <LandingFooter />
    </div>
  );
}

function LandingHeader() {
  return (
    <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="inline-flex">
          <Brand />
        </Link>
        <LandingNav />
        <div className="flex items-center gap-1.5 sm:gap-2">
          <ThemeToggle />
          <Button variant="ghost" size="sm" asChild>
            <Link href="/login">Entrar</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/register">Criar conta</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden border-b">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-dotgrid opacity-60 [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,black,transparent)]"
      />
      <div className="relative mx-auto w-full max-w-5xl px-4 py-20 text-center sm:px-6 sm:py-28">
        <span
          className="reveal inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm"
        >
          <span className="size-1.5 rounded-full bg-brand" />
          Mega-Sena &amp; Lotofácil · dados oficiais da Caixa
        </span>

        <h1
          className="reveal mx-auto mt-7 max-w-4xl text-balance text-5xl font-medium leading-[1.04] tracking-tight sm:text-6xl md:text-7xl"
          style={{ animationDelay: "60ms" }}
        >
          Faça sua própria{" "}
          <span className="text-brand-strong italic">sorte</span> com dados, não
          com
          achismo.
        </h1>

        <p
          className="reveal mx-auto mt-6 max-w-2xl text-pretty text-base text-muted-foreground sm:text-lg"
          style={{ animationDelay: "120ms" }}
        >
          Análises estatísticas completas, geração de jogos com machine learning
          e fechamentos com garantia matemática — tudo sobre o histórico oficial,
          sempre atualizado.
        </p>

        <div
          className="reveal mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
          style={{ animationDelay: "180ms" }}
        >
          <Button size="lg" asChild>
            <Link href="/register">
              Criar conta grátis
              <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/analise">Explorar análises</Link>
          </Button>
        </div>

        <p
          className="reveal mt-4 text-xs text-muted-foreground"
          style={{ animationDelay: "240ms" }}
        >
          Grátis para começar. As análises são abertas — sem cartão.
        </p>

        <DrawStrip />
      </div>
    </section>
  );
}

/** Faixa decorativa de dezenas — motivo de volante (ilustrativo). */
function DrawStrip() {
  const numbers = [4, 17, 23, 31, 42, 56];
  return (
    <div
      className="reveal mx-auto mt-14 flex w-fit max-w-full items-center gap-3 overflow-x-auto rounded-full border bg-card/70 px-5 py-3 shadow-sm backdrop-blur-sm"
      style={{ animationDelay: "300ms" }}
    >
      <span className="shrink-0 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        Leitura
      </span>
      <span className="h-5 w-px shrink-0 bg-border" />
      <div className="flex items-center gap-2">
        {numbers.map((n, i) => (
          <span
            key={n}
            className={cn(
              "flex size-8 shrink-0 items-center justify-center rounded-full font-mono text-sm tnum",
              i % 3 === 1
                ? "bg-brand text-brand-foreground"
                : "bg-secondary text-secondary-foreground"
            )}
          >
            {String(n).padStart(2, "0")}
          </span>
        ))}
      </div>
    </div>
  );
}

function TrustStrip() {
  const items = [
    "Dados oficiais da Caixa",
    "Análises 100% grátis",
    "Sem promessa de ganho",
  ];
  return (
    <section className="border-b bg-card/40">
      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 divide-y px-4 sm:grid-cols-3 sm:divide-x sm:divide-y-0 sm:px-6">
        {items.map((t) => (
          <div
            key={t}
            className="flex items-center justify-center gap-2 px-4 py-4 text-sm text-muted-foreground"
          >
            <Check className="size-4 text-brand-strong" strokeWidth={2.5} />
            {t}
          </div>
        ))}
      </div>
    </section>
  );
}

function Features() {
  return (
    <section id="recursos" className="scroll-mt-20 border-b">
      <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="max-w-2xl">
          <p className="text-sm font-medium text-brand-strong">Recursos</p>
          <h2 className="mt-2 text-3xl font-medium tracking-tight sm:text-4xl">
            Tudo para apostar com método
          </h2>
          <p className="mt-3 text-muted-foreground">
            Quanto mais você lê os dados, mais confiança tem nas suas escolhas.
            A plataforma entrega informação densa e legível — você decide.
          </p>
        </div>
        <div className="mt-12 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="bg-card p-6">
                <div className="flex size-10 items-center justify-center rounded-lg border bg-background">
                  <Icon className="size-5 text-foreground" strokeWidth={1.75} />
                </div>
                <h3 className="mt-4 text-lg font-medium tracking-tight">
                  {f.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {f.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function PlanFeatureList({
  features,
  side,
}: {
  features: PlanFeature[];
  side: "free" | "premium";
}) {
  return (
    <ul className="flex flex-col gap-3">
      {features.map((f) => {
        const value = side === "free" ? f.free : f.premium;
        const off = value === false;
        const qualifier = typeof value === "string" ? value : null;
        return (
          <li key={f.label} className="flex items-start gap-2.5 text-sm">
            <span className="mt-0.5 shrink-0">
              {off ? (
                <Minus className="size-4 text-muted-foreground/40" />
              ) : (
                <Check className="size-4 text-brand-strong" strokeWidth={2.5} />
              )}
            </span>
            <span className={off ? "text-muted-foreground/55" : ""}>
              {f.label}
              {qualifier && (
                <span className="text-muted-foreground"> · {qualifier}</span>
              )}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function Pricing() {
  return (
    <section id="planos" className="scroll-mt-20 border-b bg-card/40">
      <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium text-brand-strong">Planos</p>
          <h2 className="mt-2 text-3xl font-medium tracking-tight sm:text-4xl">
            Comece grátis, evolua quando quiser
          </h2>
          <p className="mt-3 text-muted-foreground">
            As análises e a tabela de concursos são gratuitas para sempre. O
            Premium é pagamento único: pague uma vez, use para sempre.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-4xl grid-cols-1 gap-6 md:grid-cols-2">
          {/* Grátis */}
          <div className="flex flex-col rounded-2xl border bg-card p-8 shadow-sm">
            <h3 className="text-lg font-medium tracking-tight">Grátis</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Para explorar e apostar com dados.
            </p>
            <div className="mt-6 flex items-end gap-1">
              <span className="font-mono text-4xl font-medium tracking-tight tnum">
                {formatBRL(0)}
              </span>
              <span className="pb-1.5 text-sm text-muted-foreground">
                /sempre
              </span>
            </div>
            <div className="mt-8 flex-1">
              <PlanFeatureList features={PLAN_FEATURES} side="free" />
            </div>
            <Button variant="outline" className="mt-8 w-full" asChild>
              <Link href="/register">Criar conta grátis</Link>
            </Button>
          </div>

          {/* Premium */}
          <div className="relative flex flex-col rounded-2xl border-2 border-brand bg-card p-8 shadow-md">
            <span className="absolute -top-3 left-8 inline-flex items-center gap-1.5 rounded-full bg-brand px-3 py-1 text-xs font-medium text-brand-foreground shadow-sm">
              <Crown className="size-3" /> Oferta de lançamento −{launchDiscountPct()}%
            </span>
            <h3 className="text-lg font-medium tracking-tight">
              Premium vitalício
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Geração sem limites, fechamentos e automação. Para sempre.
            </p>
            <div className="mt-6">
              <span className="text-sm text-muted-foreground line-through">
                {formatBRL(LIFETIME_PRICE.full)}
              </span>
              <div className="flex items-end gap-1">
                <span className="font-mono text-4xl font-medium tracking-tight tnum">
                  {formatBRL(LIFETIME_PRICE.launch)}
                </span>
                <span className="pb-1.5 text-sm text-muted-foreground">
                  /única vez
                </span>
              </div>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Pix, boleto ou cartão via Mercado Pago — sem mensalidade.
            </p>
            <div className="mt-8 flex-1">
              <PlanFeatureList features={PLAN_FEATURES} side="premium" />
            </div>
            <Button className="mt-8 w-full" asChild>
              <Link href="/register">
                <Crown className="size-4" />
                Começar agora
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function Disclaimer() {
  return (
    <section>
      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
        <div className="rounded-2xl border border-dashed bg-card/40 p-6 text-center">
          <p className="mx-auto max-w-2xl text-sm leading-relaxed text-muted-foreground">
            <strong className="font-medium text-foreground">
              Loteria é jogo de azar.
            </strong>{" "}
            As análises são estatísticas sobre sorteios passados e métricas como
            &ldquo;afinidade&rdquo; não são probabilidade de ganhar — nenhuma
            ferramenta aumenta sua chance real de prêmio. Aposte apenas o que
            pode perder.
          </p>
        </div>
      </div>
    </section>
  );
}

function LandingFooter() {
  return (
    <footer className="border-t">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6">
        <Brand />
        <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <Link href="/analise" className="hover:text-foreground">
            Análises
          </Link>
          <Link href="/tabela" className="hover:text-foreground">
            Concursos
          </Link>
          <Link href="/login" className="hover:text-foreground">
            Entrar
          </Link>
          <Link href="/register" className="hover:text-foreground">
            Criar conta
          </Link>
        </nav>
        <p className="text-xs text-muted-foreground">© 2026 Dezena</p>
      </div>
    </footer>
  );
}
