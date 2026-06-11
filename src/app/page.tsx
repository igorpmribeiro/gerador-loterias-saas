import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ChartColumnBig,
  Check,
  ChevronDown,
  ClipboardCheck,
  Crown,
  Database,
  Dices,
  History,
  Layers,
  Minus,
} from "lucide-react";
import { LandingNav } from "@/components/landing-nav";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  FREE_LIMITS,
  LIFETIME_PRICE,
  PLAN_FEATURES,
  formatBRL,
  launchDiscountPct,
  type PlanFeature,
} from "@/lib/plans";

export const metadata: Metadata = {
  title: {
    absolute:
      "Dezena — Análise estatística e geração de jogos para Mega-Sena e Lotofácil",
  },
  description:
    "Todos os concursos da Mega-Sena e da Lotofácil destrinchados em 12 análises estatísticas. Geração de jogos com machine learning, fechamentos com garantia e conferência automática. Dados oficiais da Caixa, análises grátis e sem cadastro.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "/",
    siteName: "Dezena",
    title: "Dezena — A loteria é sorte. O seu jogo é método.",
    description:
      "Análises estatísticas completas da Mega-Sena e da Lotofácil, geração de jogos com ML e fechamentos com garantia. Grátis para começar.",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Dezena — análise e geração de jogos para loterias" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Dezena — A loteria é sorte. O seu jogo é método.",
    description:
      "Análises estatísticas completas da Mega-Sena e da Lotofácil, geração de jogos com ML e fechamentos com garantia.",
    images: ["/og.png"],
  },
};

/* ------------------------------ Conteúdo ------------------------------ */

const STATS = [
  { value: "2", label: "loterias cobertas", detail: "Mega-Sena e Lotofácil" },
  { value: "12", label: "análises por loteria", detail: "da frequência à afinidade entre pares" },
  { value: "5", label: "estratégias de geração", detail: "ML, quentes, atrasadas, equilibrada e aleatória" },
  { value: "100%", label: "dos concursos da história", detail: "do nº 1 ao mais recente, direto da Caixa" },
];

const FEATURES = [
  {
    icon: ChartColumnBig,
    plan: "Grátis",
    title: "12 análises por loteria",
    desc: "Frequência, atraso, quentes e frias, soma, pares × ímpares, primos, consecutivos, repetidas do concurso anterior, finais, faixas, zonas do volante e afinidade entre pares — calculadas sobre o histórico completo.",
  },
  {
    icon: Dices,
    plan: `Grátis · ${FREE_LIMITS.generationsPerDay}/dia`,
    title: "Geração com machine learning",
    desc: "O modelo pondera frequência com decaimento temporal, pressão de atraso, tendência recente e afinidade entre dezenas — e nunca entrega um jogo que já foi sorteado na história.",
  },
  {
    icon: Layers,
    plan: "Premium",
    title: "Fechamentos com garantia",
    desc: "Jogue com mais dezenas (até 12 na Mega, 18 na Lotofácil) e desdobre em jogos com garantia matemática de premiação mínima condicionada — com o custo total calculado antes de você apostar.",
  },
  {
    icon: ClipboardCheck,
    plan: "Premium",
    title: "Conferência automática",
    desc: "Cada novo sorteio confere seus jogos sozinho: acertos, faixa de prêmio e evolução concurso a concurso. Aposente a planilha e a conferência dezena por dezena.",
  },
  {
    icon: History,
    plan: "Grátis",
    title: "Teimosinha organizada",
    desc: `Salve seus jogos (até ${FREE_LIMITS.savedGames} no grátis, ilimitados no Premium), repita-os nos próximos concursos e acompanhe o desempenho de cada um ao longo do tempo.`,
  },
  {
    icon: Database,
    plan: "Grátis",
    title: "Dados oficiais, sempre frescos",
    desc: "Os resultados vêm direto da API oficial da Caixa e são sincronizados toda madrugada, depois dos sorteios. Nada de planilha desatualizada de fórum.",
  },
];

const FAQ = [
  {
    q: "Usar o Dezena aumenta minha chance de ganhar?",
    a: "Não — e desconfie de qualquer ferramenta que prometa isso. Loteria é jogo de azar: cada dezena tem a mesma probabilidade em todo sorteio. O que o Dezena faz é outra coisa: organizar décadas de resultados em análises legíveis e gerar jogos com método, em vez de chute.",
  },
  {
    q: "Então o que eu ganho com a plataforma?",
    a: "Tempo e método. Você lê em segundos o que levaria horas de planilha: frequências, atrasos, somas, pares que saem juntos. Os jogos gerados respeitam os padrões que você escolheu e nunca repetem um resultado que já saiu na história. E no Premium, fechamentos com garantia matemática e conferência automática de prêmios.",
  },
  {
    q: "De onde vêm os resultados?",
    a: "Da API oficial da Caixa Econômica Federal. O banco cobre todos os concursos da Mega-Sena e da Lotofácil, do nº 1 ao mais recente, e é sincronizado toda madrugada, depois dos sorteios.",
  },
  {
    q: "O que é a nota de confiança dos jogos gerados?",
    a: "Uma escala de 5 a 99 que mede o quanto o jogo se aproxima dos padrões históricos da loteria (soma, paridade, afinidade entre dezenas, atraso). Não é probabilidade de ganhar — é uma medida de afinidade estatística com o que costuma ser sorteado.",
  },
  {
    q: "O que são fechamentos (desdobramentos)?",
    a: "Em vez de 6 dezenas, você escolhe, por exemplo, 9 na Mega-Sena. O sistema desdobra essas 9 em vários jogos com garantia matemática condicionada — por exemplo: se 4 das suas 9 dezenas forem sorteadas, pelo menos um jogo terá quadra. O custo total aparece antes de você decidir.",
  },
  {
    q: "Preciso pagar para usar?",
    a: `Não. As análises e a tabela de concursos são abertas — você nem precisa de conta. Com a conta grátis, você gera até ${FREE_LIMITS.generationsPerDay} vezes por dia (${FREE_LIMITS.gamesPerGeneration} jogos por vez) e salva até ${FREE_LIMITS.savedGames} jogos. Para sempre.`,
  },
  {
    q: "O Premium é assinatura?",
    a: `Não. É pagamento único de ${formatBRL(LIFETIME_PRICE.launch)} no lançamento (preço cheio: ${formatBRL(LIFETIME_PRICE.full)}) via Pix, boleto ou cartão pelo Mercado Pago. Pagou uma vez, é seu para sempre — sem mensalidade, sem renovação automática, sem surpresa na fatura.`,
  },
];

function JsonLd() {
  const data = [
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: "Dezena",
      url: "https://www.dezena.app.br",
      applicationCategory: "UtilitiesApplication",
      operatingSystem: "Web",
      description:
        "Análise estatística e geração de jogos com machine learning para Mega-Sena e Lotofácil, com dados oficiais da Caixa.",
      offers: [
        { "@type": "Offer", price: "0", priceCurrency: "BRL", name: "Grátis" },
        {
          "@type": "Offer",
          price: LIFETIME_PRICE.launch.toFixed(2),
          priceCurrency: "BRL",
          name: "Premium vitalício (pagamento único)",
        },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: FAQ.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
  ];
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/* ------------------------------- Página ------------------------------- */

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <JsonLd />
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground"
      >
        Pular para o conteúdo
      </a>
      <LandingHeader />
      <main id="conteudo" className="flex-1">
        <Hero />
        <StatsBar />
        <HowItWorks />
        <AnalysisShowcase />
        <Features />
        <Lotteries />
        <Generator />
        <Pricing />
        <Faq />
        <FinalCta />
        <Disclaimer />
      </main>
      <LandingFooter />
    </div>
  );
}

function LandingHeader() {
  return (
    <header className="sticky top-0 z-30 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link href="/" className="inline-flex shrink-0 items-center" aria-label="Dezena — página inicial">
          <Image
            src="/logo-desktop.png"
            alt="Dezena — análise e geração de jogos para loterias"
            width={720}
            height={181}
            priority
            sizes="144px"
            className="hidden h-9 w-auto lg:block"
          />
          <Image
            src="/logo-mobile.png"
            alt="Dezena"
            width={148}
            height={102}
            priority
            sizes="56px"
            className="h-9 w-auto lg:hidden"
          />
        </Link>
        <LandingNav />
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/login">Entrar</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/register">Criar conta grátis</Link>
          </Button>
        </div>
      </div>
      <div aria-hidden className="hairline-brand opacity-70" />
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden border-b">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-aurora" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-dotgrid opacity-40 [mask-image:radial-gradient(ellipse_75%_65%_at_50%_0%,black,transparent)]"
      />
      <div className="relative mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-12 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8">
        <div>
          <span className="reveal inline-flex items-center gap-2 rounded-full border bg-card/70 px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur-sm">
            <span aria-hidden className="size-1.5 rounded-full bg-dz-green" />
            Mega-Sena &amp; Lotofácil · dados oficiais da Caixa
          </span>

          <h1
            className="reveal mt-6 max-w-2xl text-balance text-[2.6rem] font-medium leading-[1.05] tracking-tight sm:text-6xl lg:text-[4.1rem]"
            style={{ animationDelay: "60ms" }}
          >
            A loteria é sorte.{" "}
            <em className="text-brand-strong">O seu jogo é método.</em>
          </h1>

          <p
            className="reveal mt-6 max-w-xl text-pretty text-base text-muted-foreground sm:text-lg"
            style={{ animationDelay: "120ms" }}
          >
            O Dezena destrincha <strong className="font-medium text-foreground">todos os concursos já sorteados</strong>{" "}
            da Mega-Sena e da Lotofácil — frequência, atraso, somas, pares e
            afinidades entre dezenas — e transforma essa leitura em jogos
            gerados com machine learning, fechamentos com garantia e
            conferência automática de resultados.
          </p>

          <div
            className="reveal mt-8 flex flex-col gap-3 sm:flex-row sm:items-center"
            style={{ animationDelay: "180ms" }}
          >
            <Button size="lg" asChild>
              <Link href="/register">
                Começar grátis
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/analise">Ver as análises abertas</Link>
            </Button>
          </div>

          <p
            className="reveal mt-4 text-xs text-muted-foreground"
            style={{ animationDelay: "240ms" }}
          >
            Sem cartão de crédito. As análises e o histórico de concursos são
            abertos — você nem precisa de conta para explorar.
          </p>
        </div>

        <GeneratorMock />
      </div>
    </section>
  );
}

/**
 * Vitrine do produto no hero: um jogo gerado (ilustrativo) com as métricas
 * reais que a plataforma calcula. Decorativo — o conteúdo está no texto.
 */
function GeneratorMock() {
  const game = ["04", "11", "23", "34", "47", "56"];
  const metrics = [
    { label: "Soma", value: "175" },
    { label: "Pares", value: "3 de 6" },
    { label: "Primos", value: "3" },
    { label: "Repetidas", value: "0" },
  ];
  return (
    <div aria-hidden className="reveal relative mx-auto w-full max-w-md select-none lg:mx-0" style={{ animationDelay: "200ms" }}>
      {/* cartão de fundo — Lotofácil */}
      <div className="float-slow absolute -right-3 -top-6 hidden w-64 rotate-3 rounded-2xl border bg-card/80 p-4 shadow-lg backdrop-blur-sm sm:block">
        <div className="flex items-center justify-between">
          <span className="rounded-full bg-lotofacil px-2.5 py-0.5 text-[11px] font-medium text-lotofacil-foreground">
            Lotofácil
          </span>
          <span className="font-mono text-[11px] text-muted-foreground tnum">15 dezenas</span>
        </div>
        <div className="mt-3 grid grid-cols-8 gap-1.5">
          {[1, 3, 4, 6, 9, 10, 12, 14, 15, 18, 20, 21, 22, 24, 25].map((n) => (
            <span
              key={n}
              className="flex size-6 items-center justify-center rounded-full bg-secondary font-mono text-[10px] text-secondary-foreground tnum"
            >
              {String(n).padStart(2, "0")}
            </span>
          ))}
        </div>
      </div>

      {/* cartão principal — Mega-Sena */}
      <div className="border-gradient-brand relative rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Jogo gerado · estratégia ML
            </p>
            <p className="mt-0.5 font-mono text-xs text-muted-foreground tnum">
              não repetido na história
            </p>
          </div>
          <span className="rounded-full bg-mega px-2.5 py-0.5 text-[11px] font-medium text-mega-foreground">
            Mega-Sena
          </span>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2.5">
          {game.map((n, i) => (
            <span
              key={n}
              className={cn(
                "flex size-11 items-center justify-center rounded-full font-mono text-base font-medium tnum shadow-sm",
                i % 2 === 0
                  ? "bg-secondary text-secondary-foreground"
                  : "bg-primary text-primary-foreground"
              )}
            >
              {n}
            </span>
          ))}
        </div>

        <dl className="mt-5 grid grid-cols-4 gap-2 border-t pt-4">
          {metrics.map((m) => (
            <div key={m.label}>
              <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {m.label}
              </dt>
              <dd className="mt-0.5 font-mono text-sm tnum">{m.value}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-4">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Nota de confiança</span>
            <span className="font-mono tnum">82 / 99</span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full w-[82%] rounded-full"
              style={{
                background:
                  "linear-gradient(90deg, var(--dz-green), var(--dz-teal) 45%, var(--dz-blue))",
              }}
            />
          </div>
        </div>
      </div>

      {/* chip flutuante — frequência */}
      <div className="float-slower absolute -bottom-9 -left-2 rounded-xl border bg-card/90 px-3.5 py-2.5 shadow-lg backdrop-blur-sm sm:-left-6">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
          Frequência · Mega-Sena
        </p>
        <p className="mt-0.5 font-mono text-sm tnum">
          <span className="font-medium text-dz-green">10</span>
          <span className="text-muted-foreground"> · líder histórica</span>
        </p>
      </div>
    </div>
  );
}

function StatsBar() {
  return (
    <section className="border-b bg-card/50" aria-label="Números da plataforma">
      <div className="mx-auto grid w-full max-w-6xl grid-cols-2 divide-border px-4 sm:px-6 lg:grid-cols-4 lg:divide-x">
        {STATS.map((s) => (
          <div key={s.label} className="px-4 py-6 text-center lg:py-8">
            <p className="font-mono text-3xl font-medium tracking-tight text-foreground tnum sm:text-4xl">
              {s.value}
            </p>
            <p className="mt-1 text-sm font-medium">{s.label}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{s.detail}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      n: "01",
      color: "var(--dz-green)",
      title: "Explore de graça, sem conta",
      desc: "As 12 análises e a tabela com todos os concursos são abertas. Veja o que os números mostram antes de decidir qualquer coisa.",
      cta: { label: "Abrir análises", href: "/analise" },
    },
    {
      n: "02",
      color: "var(--dz-blue)",
      title: "Crie a conta e gere seus jogos",
      desc: `Com a conta grátis, o gerador de ML monta até ${FREE_LIMITS.generationsPerDay * FREE_LIMITS.gamesPerGeneration} jogos por dia para você, na estratégia que escolher — quentes, atrasadas, equilibrada ou o modelo completo.`,
      cta: { label: "Criar conta grátis", href: "/register" },
    },
    {
      n: "03",
      color: "var(--dz-violet)",
      title: "Destrave tudo com um único pagamento",
      desc: `Por ${formatBRL(LIFETIME_PRICE.launch)} — uma vez, sem mensalidade — você libera geração ilimitada, fechamentos com garantia e conferência automática de prêmios. Para sempre.`,
      cta: { label: "Ver planos", href: "#planos" },
    },
  ];
  return (
    <section id="como-funciona" className="scroll-mt-20 border-b">
      <div className="scroll-reveal mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="max-w-2xl">
          <p className="text-sm font-medium text-brand-strong">Como funciona</p>
          <h2 className="mt-2 text-3xl font-medium tracking-tight sm:text-4xl">
            Do primeiro clique ao jogo no volante
          </h2>
          <p className="mt-3 text-muted-foreground">
            Três passos — e os dois primeiros não custam nada.
          </p>
        </div>
        <ol className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          {steps.map((s) => (
            <li
              key={s.n}
              className="hover-lift relative flex flex-col rounded-2xl border bg-card p-6 hover:border-foreground/20"
            >
              <span
                aria-hidden
                className="absolute inset-x-6 top-0 h-px"
                style={{
                  background: `linear-gradient(90deg, ${s.color}, transparent)`,
                }}
              />
              <span
                className="font-mono text-sm font-medium tnum"
                style={{ color: s.color }}
              >
                {s.n}
              </span>
              <h3 className="mt-3 text-lg font-medium tracking-tight">
                {s.title}
              </h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                {s.desc}
              </p>
              <Link
                href={s.cta.href}
                className="group mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-brand-strong hover:underline"
              >
                {s.cta.label}
                <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function AnalysisShowcase() {
  const freq = [
    { n: "10", w: 100 },
    { n: "53", w: 96 },
    { n: "05", w: 93 },
    { n: "23", w: 91 },
    { n: "33", w: 89 },
  ];
  const overdue = [
    { n: "26", txt: "não sai há 38 concursos" },
    { n: "55", txt: "não sai há 31 concursos" },
    { n: "09", txt: "não sai há 27 concursos" },
  ];
  const pairs = ["10 · 53", "04 · 23", "33 · 42"];
  return (
    <section className="border-b bg-card/40">
      <div className="scroll-reveal mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-12 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-2">
        <div>
          <p className="text-sm font-medium text-brand-strong">Análises abertas</p>
          <h2 className="mt-2 text-3xl font-medium tracking-tight sm:text-4xl">
            Você nunca mais olha um volante do mesmo jeito
          </h2>
          <p className="mt-4 text-muted-foreground">
            Cada concurso da história alimenta as análises. Em segundos, você
            descobre o que levaria horas de planilha:
          </p>
          <ul className="mt-6 space-y-3 text-sm">
            {[
              "Quantas vezes cada dezena saiu — e há quantos concursos ela não aparece",
              "A faixa de soma onde os sorteios se concentram (e quando seu jogo foge dela)",
              "Quais pares de dezenas insistem em sair juntos, concurso após concurso",
              "Equilíbrio de pares × ímpares, primos, consecutivos e zonas do volante",
            ].map((t) => (
              <li key={t} className="flex items-start gap-2.5">
                <Check className="mt-0.5 size-4 shrink-0 text-brand-strong" strokeWidth={2.5} />
                <span>{t}</span>
              </li>
            ))}
          </ul>
          <Button size="lg" variant="outline" className="mt-8" asChild>
            <Link href="/analise">
              Explorar agora — sem cadastro
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>

        {/* Painéis ilustrativos das análises (decorativos) */}
        <div aria-hidden className="select-none space-y-4">
          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Frequência · Mega-Sena · exemplo
            </p>
            <div className="mt-4 space-y-2.5">
              {freq.map((f, i) => (
                <div key={f.n} className="flex items-center gap-3">
                  <span className="w-6 font-mono text-sm tnum">{f.n}</span>
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${f.w}%`,
                        background: `linear-gradient(90deg, var(--dz-green), ${
                          i < 2 ? "var(--dz-teal)" : "var(--dz-blue)"
                        })`,
                        opacity: 1 - i * 0.12,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border bg-card p-5 shadow-sm">
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Atraso · exemplo
              </p>
              <ul className="mt-3 space-y-2">
                {overdue.map((o) => (
                  <li key={o.n} className="flex items-baseline gap-2 text-sm">
                    <span className="font-mono font-medium text-dz-violet tnum">{o.n}</span>
                    <span className="text-xs text-muted-foreground">{o.txt}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border bg-card p-5 shadow-sm">
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Pares com afinidade
              </p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {pairs.map((p) => (
                  <li
                    key={p}
                    className="rounded-full border px-3 py-1 font-mono text-xs tnum"
                  >
                    {p}
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-muted-foreground">
                dezenas que saem juntas acima da média
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Features() {
  return (
    <section id="recursos" className="scroll-mt-20 border-b">
      <div className="scroll-reveal mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="max-w-2xl">
          <p className="text-sm font-medium text-brand-strong">Recursos</p>
          <h2 className="mt-2 text-3xl font-medium tracking-tight sm:text-4xl">
            Tudo para apostar com método
          </h2>
          <p className="mt-3 text-muted-foreground">
            Informação densa, legível e honesta. A plataforma entrega a
            leitura — a decisão continua sua.
          </p>
        </div>
        <div className="mt-12 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="flex flex-col bg-card p-6">
                <div className="flex items-start justify-between">
                  <div className="flex size-10 items-center justify-center rounded-lg border bg-background">
                    <Icon className="size-5 text-foreground" strokeWidth={1.75} />
                  </div>
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-[11px] font-medium",
                      f.plan.startsWith("Premium")
                        ? "bg-dz-violet/20 text-foreground"
                        : "bg-dz-green/15 text-dz-green"
                    )}
                  >
                    {f.plan}
                  </span>
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

function Lotteries() {
  const items = [
    {
      name: "Mega-Sena",
      colorClass: "bg-mega text-mega-foreground",
      facts: ["60 dezenas no volante", "6 sorteadas", "aposta simples: R$ 5"],
      desc: "O maior prêmio do país. Aqui você vê as somas que mais saem, as dezenas mais atrasadas e monta fechamentos de 7 a 12 dezenas com garantia de quadra ou quina condicionada.",
      sample: [4, 11, 23, 34, 47, 56],
    },
    {
      name: "Lotofácil",
      colorClass: "bg-lotofacil text-lotofacil-foreground",
      facts: ["25 dezenas no volante", "15 sorteadas", "aposta simples: R$ 3"],
      desc: "A loteria de quem joga todo dia. Com 15 de 25 dezenas sorteadas, padrões de repetição e paridade pesam mais — e prêmios começam já com 11 acertos.",
      sample: [2, 5, 9, 11, 14, 20],
    },
  ];
  return (
    <section className="border-b bg-card/40">
      <div className="scroll-reveal mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="max-w-2xl">
          <p className="text-sm font-medium text-brand-strong">Loterias</p>
          <h2 className="mt-2 text-3xl font-medium tracking-tight sm:text-4xl">
            As duas mais jogadas do Brasil
          </h2>
          <p className="mt-3 text-muted-foreground">
            Escolha a loteria — o método é o mesmo: dados completos, análise e
            geração sob medida para as regras de cada uma.
          </p>
        </div>
        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2">
          {items.map((l) => (
            <article
              key={l.name}
              className="hover-lift flex flex-col rounded-2xl border bg-card p-7 hover:border-foreground/20"
            >
              <div className="flex flex-wrap items-center gap-3">
                <span className={cn("rounded-full px-3 py-1 text-sm font-medium", l.colorClass)}>
                  {l.name}
                </span>
                <span aria-hidden className="flex items-center gap-1.5">
                  {l.sample.map((n) => (
                    <span
                      key={n}
                      className="flex size-7 items-center justify-center rounded-full bg-secondary font-mono text-[11px] text-secondary-foreground tnum"
                    >
                      {String(n).padStart(2, "0")}
                    </span>
                  ))}
                </span>
              </div>
              <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-muted-foreground">
                {l.facts.map((f) => (
                  <li key={f} className="flex items-center gap-1.5">
                    <span aria-hidden className="size-1 rounded-full bg-brand" />
                    {f}
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                {l.desc}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Generator() {
  const factors = [
    {
      title: "Frequência com memória curta",
      desc: "Cada sorteio conta, mas os recentes pesam mais — um decaimento exponencial atualiza o peso de cada dezena a cada concurso.",
    },
    {
      title: "Pressão de atraso",
      desc: "Dezenas muito atrasadas em relação ao próprio ritmo histórico ganham um empurrão no modelo.",
    },
    {
      title: "Tendência recente",
      desc: "Uma janela dos últimos 60 concursos captura o humor atual da loteria, além da média histórica.",
    },
    {
      title: "Afinidade entre dezenas",
      desc: "Uma matriz de coocorrência aprende quais pares costumam sair juntos — e usa isso na montagem do jogo.",
    },
  ];
  const strategies = ["ML (recomendada)", "Quentes", "Atrasadas", "Equilibrada", "Aleatória"];
  return (
    <section className="border-b">
      <div className="scroll-reveal mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-sm font-medium text-brand-strong">O gerador</p>
            <h2 className="mt-2 text-3xl font-medium tracking-tight sm:text-4xl">
              Como o modelo pensa antes de sugerir um jogo
            </h2>
            <p className="mt-4 text-muted-foreground">
              Nada de caixa-preta: o gerador combina quatro sinais estatísticos,
              refina cada jogo por <em>simulated annealing</em> e descarta
              qualquer combinação que já tenha sido sorteada na história. Cada
              jogo sai com uma nota de confiança de 5 a 99 — afinidade com os
              padrões históricos, não promessa de prêmio.
            </p>
            <div className="mt-6">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Estratégias disponíveis
              </p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {strategies.map((s, i) => (
                  <li
                    key={s}
                    className={cn(
                      "rounded-full border px-3.5 py-1.5 text-sm",
                      i === 0 && "border-gradient-brand font-medium"
                    )}
                  >
                    {s}
                  </li>
                ))}
              </ul>
            </div>
            <Link
              href="/register"
              className="group mt-7 inline-flex items-center gap-1.5 text-sm font-medium text-brand-strong hover:underline"
            >
              Gerar meus primeiros jogos grátis
              <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
          <ol className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {factors.map((f, i) => (
              <li
                key={f.title}
                className="hover-lift rounded-2xl border bg-card p-5 hover:border-foreground/20"
              >
                <span className="font-mono text-xs text-brand-strong tnum">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-2 text-base font-medium tracking-tight">
                  {f.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {f.desc}
                </p>
              </li>
            ))}
          </ol>
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
                <Minus aria-hidden className="size-4 text-muted-foreground/40" />
              ) : (
                <Check aria-hidden className="size-4 text-brand-strong" strokeWidth={2.5} />
              )}
            </span>
            <span className={off ? "text-muted-foreground/55" : ""}>
              {off && <span className="sr-only">não incluso: </span>}
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
      <div className="scroll-reveal mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium text-brand-strong">Planos</p>
          <h2 className="mt-2 text-3xl font-medium tracking-tight sm:text-4xl">
            Comece grátis. Pague uma vez, se quiser mais.
          </h2>
          <p className="mt-3 text-muted-foreground">
            As análises e a tabela de concursos são gratuitas para sempre — por
            filosofia. O Premium não é assinatura: é um único pagamento, seu
            para o resto da vida.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-4xl grid-cols-1 gap-6 md:grid-cols-2">
          {/* Grátis */}
          <div className="hover-lift flex flex-col rounded-2xl border bg-card p-8 shadow-sm">
            <h3 className="text-lg font-medium tracking-tight">Grátis</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Para explorar os dados e gerar seus primeiros jogos.
            </p>
            <div className="mt-6 flex items-end gap-1">
              <span className="font-mono text-4xl font-medium tracking-tight tnum">
                {formatBRL(0)}
              </span>
              <span className="pb-1.5 text-sm text-muted-foreground">/para sempre</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Sem cartão, sem período de teste — grátis é grátis.
            </p>
            <div className="mt-8 flex-1">
              <PlanFeatureList features={PLAN_FEATURES} side="free" />
            </div>
            <Button variant="outline" className="mt-8 w-full" asChild>
              <Link href="/register">Criar conta grátis</Link>
            </Button>
          </div>

          {/* Premium */}
          <div className="border-gradient-brand hover-lift relative flex flex-col rounded-2xl p-8 shadow-xl">
            <span className="absolute -top-3 left-8 inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground shadow-sm">
              <Crown aria-hidden className="size-3" /> Oferta de lançamento −{launchDiscountPct()}%
            </span>
            <h3 className="text-lg font-medium tracking-tight">Premium vitalício</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Geração ilimitada, fechamentos e conferência automática.
            </p>
            <div className="mt-6">
              <span className="text-sm text-muted-foreground">
                de{" "}
                <span className="line-through">{formatBRL(LIFETIME_PRICE.full)}</span>
                {" "}por
              </span>
              <div className="flex items-end gap-1">
                <span className="font-mono text-4xl font-medium tracking-tight tnum">
                  {formatBRL(LIFETIME_PRICE.launch)}
                </span>
                <span className="pb-1.5 text-sm text-muted-foreground">/única vez</span>
              </div>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              O preço de 20 apostas simples da Mega — uma única vez. Pix,
              boleto ou cartão via Mercado Pago. Sem mensalidade, sem renovação.
            </p>
            <div className="mt-8 flex-1">
              <PlanFeatureList features={PLAN_FEATURES} side="premium" />
            </div>
            <Button className="mt-8 w-full" asChild>
              <Link href="/register">
                <Crown aria-hidden className="size-4" />
                Garantir acesso vitalício
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function Faq() {
  return (
    <section id="faq" className="scroll-mt-20 border-b">
      <div className="scroll-reveal mx-auto w-full max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="text-center">
          <p className="text-sm font-medium text-brand-strong">Perguntas frequentes</p>
          <h2 className="mt-2 text-3xl font-medium tracking-tight sm:text-4xl">
            O que todo mundo pergunta antes de começar
          </h2>
        </div>
        <div className="mt-10 space-y-3">
          {FAQ.map((f) => (
            <details
              key={f.q}
              className="group rounded-xl border bg-card px-5 transition-colors open:bg-card/80"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-left font-medium [&::-webkit-details-marker]:hidden">
                {f.q}
                <ChevronDown
                  aria-hidden
                  className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
                />
              </summary>
              <p className="pb-5 text-sm leading-relaxed text-muted-foreground">
                {f.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="relative overflow-hidden border-b">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-aurora opacity-70" />
      <div className="scroll-reveal relative mx-auto w-full max-w-3xl px-4 py-16 text-center sm:px-6 sm:py-20">
        <h2 className="text-balance text-3xl font-medium tracking-tight sm:text-4xl">
          O sorteio continua sendo sorte.{" "}
          <em className="text-brand-strong">O seu lado, não.</em>
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
          Análises abertas, conta grátis em menos de um minuto e um único
          pagamento se você quiser tudo. Comece pelos dados.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
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
      </div>
    </section>
  );
}

function Disclaimer() {
  return (
    <section aria-label="Aviso sobre jogo responsável">
      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
        <div className="rounded-2xl border border-dashed bg-card/40 p-6 text-center">
          <p className="mx-auto max-w-2xl text-sm leading-relaxed text-muted-foreground">
            <strong className="font-medium text-foreground">
              Loteria é jogo de azar — e a gente faz questão de dizer isso.
            </strong>{" "}
            As análises descrevem sorteios passados; nenhuma métrica daqui (nem
            a nota de confiança) é probabilidade de ganhar, e nenhuma
            ferramenta aumenta sua chance real de prêmio. Jogue por lazer e
            aposte apenas o que pode perder.
          </p>
        </div>
      </div>
    </section>
  );
}

function LandingFooter() {
  const columns = [
    {
      title: "Produto",
      links: [
        { label: "Análises", href: "/analise" },
        { label: "Tabela de concursos", href: "/tabela" },
        { label: "Recursos", href: "#recursos" },
        { label: "Planos", href: "#planos" },
      ],
    },
    {
      title: "Conta",
      links: [
        { label: "Entrar", href: "/login" },
        { label: "Criar conta grátis", href: "/register" },
        { label: "Perguntas frequentes", href: "#faq" },
      ],
    },
  ];
  return (
    <footer style={{ background: "var(--dz-navy)" }}>
      <div aria-hidden className="hairline-brand opacity-50" />
      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
        <div className="flex flex-col gap-10 md:flex-row md:justify-between">
          <div className="max-w-sm">
            <Image
              src="/logo-desktop.png"
              alt="Dezena — análise e geração de jogos para loterias"
              width={720}
              height={181}
              sizes="144px"
              className="h-9 w-auto"
            />
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Análise estatística e geração de jogos com machine learning para
              Mega-Sena e Lotofácil, com dados oficiais da Caixa.
            </p>
          </div>
          <nav aria-label="Rodapé" className="flex gap-16">
            {columns.map((col) => (
              <div key={col.title}>
                <p className="text-sm font-medium text-foreground">{col.title}</p>
                <ul className="mt-3 space-y-2">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <Link
                        href={l.href}
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>
        <div className="mt-10 border-t border-border/60 pt-6">
          <p className="text-xs leading-relaxed text-muted-foreground">
            O Dezena é um serviço independente de análise estatística, sem
            vínculo com a Caixa Econômica Federal. Loterias são jogos de azar:
            jogue com responsabilidade e apenas se for maior de 18 anos.
          </p>
          <p className="mt-3 text-xs text-muted-foreground">© 2026 Dezena</p>
        </div>
      </div>
    </footer>
  );
}
