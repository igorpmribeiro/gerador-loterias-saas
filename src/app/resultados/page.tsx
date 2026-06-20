import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ChartColumnBig, Dices, Table2 } from "lucide-react";
import { getAllLatestResults } from "@/lib/results";
import { ResultCard } from "@/components/results/result-card";

export const runtime = "nodejs";
// SSR a cada request, lendo o banco sincronizado pelo cron — sem cache e sem
// bater na Caixa por acesso.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: {
    absolute: "Resultado das Loterias: Mega-Sena e Lotofácil · Dezena",
  },
  description:
    "Confira o resultado atualizado das loterias — os últimos números sorteados da Mega-Sena e da Lotofácil, com faixas de premiação e concursos anteriores. Dados oficiais da Caixa.",
  alternates: { canonical: "/resultados" },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "/resultados",
    siteName: "Dezena",
    title: "Resultado das Loterias: Mega-Sena e Lotofácil",
    description:
      "Os últimos números sorteados da Mega-Sena e da Lotofácil, com premiação e concursos anteriores. Dados oficiais da Caixa.",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Dezena — resultados das loterias",
      },
    ],
  },
};

function BreadcrumbJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Início",
        item: "https://www.dezena.app.br/",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Resultados",
        item: "https://www.dezena.app.br/resultados",
      },
    ],
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export default async function ResultadosPage() {
  const results = await getAllLatestResults();

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <BreadcrumbJsonLd />

      <nav aria-label="Você está em" className="mb-3 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">
          Início
        </Link>{" "}
        / <span className="text-foreground">Resultados</span>
      </nav>

      <header className="max-w-2xl">
        <h1 className="text-3xl font-medium tracking-tight sm:text-4xl">
          Resultado das loterias
        </h1>
        <p className="mt-3 text-pretty text-muted-foreground">
          Confira aqui o <strong className="font-medium text-foreground">resultado
          atualizado das loterias</strong>: os últimos números sorteados da
          Mega-Sena e da Lotofácil, com as faixas de premiação e os concursos
          anteriores. Dados oficiais da Caixa, atualizados a cada sorteio.
        </p>
      </header>

      {results.length > 0 ? (
        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          {results.map((r) => (
            <ResultCard key={r.lottery} data={r} />
          ))}
        </div>
      ) : (
        <p className="mt-8 rounded-md border bg-secondary/30 px-4 py-6 text-sm text-muted-foreground">
          Os resultados estão sendo sincronizados. Tente novamente em alguns
          instantes.
        </p>
      )}

      <section className="mt-12">
        <h2 className="text-lg font-semibold tracking-tight">
          Vá além do resultado
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          A loteria é sorte — mas a leitura dos dados é método. Explore o
          histórico completo antes de apostar.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <QuickLink
            href="/analise"
            icon={<ChartColumnBig className="size-5" />}
            title="Análise estatística"
            description="Números que mais saem, atrasos e padrões"
          />
          <QuickLink
            href="/gerador"
            icon={<Dices className="size-5" />}
            title="Gerador de jogos"
            description="Jogos por modelo estatístico e fechamentos"
          />
          <QuickLink
            href="/tabela"
            icon={<Table2 className="size-5" />}
            title="Tabela de concursos"
            description="Últimos concursos com métricas detalhadas"
          />
        </div>
      </section>
    </div>
  );
}

function QuickLink({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 rounded-lg border bg-card p-4 transition-colors hover:bg-secondary/50"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-secondary text-foreground">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold">{title}</p>
        <p className="truncate text-xs text-muted-foreground">{description}</p>
      </div>
      <ArrowRight className="ml-auto size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}
