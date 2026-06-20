import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ExternalLink } from "lucide-react";
import { Ball } from "@/components/ball";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PrizeBreakdown } from "@/components/results/prize-breakdown";
import { RecentResultsTable } from "@/components/results/recent-results-table";
import { LOTTERIES } from "@/lib/lotteries";
import { formatDate } from "@/lib/format";
import {
  getLatestResult,
  getRecentResults,
  lotteryForSlug,
  RESULT_SLUGS,
  slugForLottery,
} from "@/lib/results";

export const runtime = "nodejs";
// SSR a cada request, lendo o banco sincronizado pelo cron — sem cache.
export const dynamic = "force-dynamic";
// Apenas os slugs conhecidos são válidos; o resto retorna 404.
export const dynamicParams = false;

const RECENT_LIMIT = 15;

interface PageProps {
  params: Promise<{ loteria: string }>;
}

export function generateStaticParams(): { loteria: string }[] {
  return RESULT_SLUGS.map((loteria) => ({ loteria }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { loteria } = await params;
  const lottery = lotteryForSlug(loteria);
  if (!lottery) return {};

  const cfg = LOTTERIES[lottery];
  const latest = await getLatestResult(lottery);
  const canonical = `/resultados/${loteria}`;

  const suffix = latest
    ? ` ${latest.contest} (${formatDate(latest.date)})`
    : "";
  const title = `Resultado da ${cfg.name}${suffix}: números sorteados`;
  const description = latest
    ? `Resultado da ${cfg.name} concurso ${latest.contest} (${formatDate(
        latest.date
      )}): ${latest.numbers
        .map((n) => n.toString().padStart(2, "0"))
        .join(", ")}. Veja a premiação e os concursos anteriores. Dados oficiais da Caixa.`
    : `Resultado atualizado da ${cfg.name}: últimos números sorteados, premiação e concursos anteriores. Dados oficiais da Caixa.`;

  return {
    title: { absolute: `${title} · Dezena` },
    description,
    alternates: { canonical },
    openGraph: {
      type: "website",
      locale: "pt_BR",
      url: canonical,
      siteName: "Dezena",
      title: `Resultado da ${cfg.name}${suffix}`,
      description,
      images: [
        {
          url: "/og.png",
          width: 1200,
          height: 630,
          alt: `Dezena — resultado da ${cfg.name}`,
        },
      ],
    },
  };
}

function BreadcrumbJsonLd({ name, slug }: { name: string; slug: string }) {
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
      {
        "@type": "ListItem",
        position: 3,
        name: `Resultado da ${name}`,
        item: `https://www.dezena.app.br/resultados/${slug}`,
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

export default async function ResultadoLoteriaPage({ params }: PageProps) {
  const { loteria } = await params;
  const lottery = lotteryForSlug(loteria);
  if (!lottery) notFound();

  const cfg = LOTTERIES[lottery];
  const tone = cfg.colorVar;
  const [latest, recent] = await Promise.all([
    getLatestResult(lottery),
    getRecentResults(lottery, RECENT_LIMIT),
  ]);

  const other = Object.values(LOTTERIES).find((l) => l.id !== lottery)!;
  const otherSlug = slugForLottery(other.id);

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
      <BreadcrumbJsonLd name={cfg.name} slug={loteria} />

      <nav aria-label="Você está em" className="mb-3 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">
          Início
        </Link>{" "}
        /{" "}
        <Link href="/resultados" className="hover:text-foreground">
          Resultados
        </Link>{" "}
        / <span className="text-foreground">{cfg.name}</span>
      </nav>

      <header className="max-w-2xl">
        <h1 className="text-3xl font-medium tracking-tight sm:text-4xl">
          Resultado da {cfg.name}
        </h1>
        {latest && (
          <p className="mt-2 text-muted-foreground tnum">
            Concurso {latest.contest} · {formatDate(latest.date)}
          </p>
        )}
        <p className="mt-3 text-pretty text-muted-foreground">
          Confira o resultado atualizado da {cfg.name} — os números sorteados no
          último concurso, as faixas de premiação e os resultados anteriores.
          Dados oficiais da Caixa. Lembrando: a loteria é um jogo de azar, e
          nenhuma análise altera as chances do sorteio.
        </p>
      </header>

      {!latest ? (
        <p className="mt-8 rounded-md border bg-secondary/30 px-4 py-6 text-sm text-muted-foreground">
          O resultado está sendo sincronizado. Tente novamente em alguns
          instantes.
        </p>
      ) : (
        <>
          <section className="mt-8 rounded-xl border bg-card p-5 sm:p-6">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Números sorteados
            </span>
            <div className="mt-3 flex flex-wrap gap-2">
              {latest.numbers.map((n) => (
                <Ball key={n} n={n} tone={tone} size="lg" />
              ))}
            </div>
            <div className="mt-5">
              {latest.accumulated ? (
                <div className="flex items-center gap-3">
                  <Badge variant="warning">Acumulou</Badge>
                  <p className="text-sm text-muted-foreground">
                    Ninguém acertou a faixa principal.
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Badge variant="success">Houve ganhador</Badge>
                  <p className="text-sm text-muted-foreground">
                    {latest.topWinners.toLocaleString("pt-BR")} aposta(s) na
                    faixa principal.
                  </p>
                </div>
              )}
            </div>
          </section>

          {latest.prizes.length > 0 && (
            <section className="mt-8">
              <h2 className="mb-3 text-lg font-semibold tracking-tight">
                Faixas de premiação — concurso {latest.contest}
              </h2>
              <PrizeBreakdown prizes={latest.prizes} />
            </section>
          )}

          <section className="mt-8">
            <h2 className="mb-3 text-lg font-semibold tracking-tight">
              Resultados anteriores da {cfg.name}
            </h2>
            <RecentResultsTable draws={recent} tone={tone} />
            <p className="mt-2 text-xs text-muted-foreground">
              {latest.totalStored.toLocaleString("pt-BR")} concursos da{" "}
              {cfg.name} no histórico.
            </p>
          </section>
        </>
      )}

      <section className="mt-12 flex flex-wrap items-center gap-3">
        <Button asChild>
          <Link href="/analise">
            Ver análise estatística da {cfg.name}
            <ArrowRight />
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href={`/resultados/${otherSlug}`}>
            Resultado da {other.name}
          </Link>
        </Button>
        <Button variant="ghost" asChild>
          <a
            href="https://loterias.caixa.gov.br/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink />
            Apostar na Caixa
          </a>
        </Button>
      </section>
    </div>
  );
}
