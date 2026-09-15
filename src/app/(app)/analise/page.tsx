import type { Metadata } from "next";
import { getDraws } from "@/lib/db";
import { getLottery, LOTTERY_LIST } from "@/lib/lotteries";
import { analyze, type AnalysisResult } from "@/lib/analysis";
import {
  analysisPath,
  parseLotteryParam,
  parseWindowParam,
  windowLimit,
  type AnalysisWindow,
} from "@/lib/analysis-window";
import { PageHeader } from "@/components/page-header";
import { AnalysisPageClient } from "@/components/analysis-page-client";

export const runtime = "nodejs";
// Renderiza a cada requisição a partir do banco sincronizado pelo cron: sem
// bater na Caixa e sempre com o último concurso.
export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/**
 * Metadata por loteria. Antes a página inteira era client e o HTML servido não
 * tinha nem título específico nem conteúdo — justo na rota desenhada para
 * "números que mais saem".
 */
export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  const sp = await searchParams;
  const lottery = parseLotteryParam(sp.loteria);
  const win = parseWindowParam(sp.janela);
  const cfg = getLottery(lottery);
  const canonical = analysisPath(lottery, "all");

  const title = `Números que mais saem na ${cfg.name}: frequência e atraso · Dezena`;
  const description = `Veja os números que mais saem na ${cfg.name}, as dezenas mais atrasadas, somas, pares e ímpares e afinidade entre dezenas. Histórico completo da Caixa, grátis e sem cadastro.`;

  return {
    title: { absolute: title },
    description,
    // Recortes por janela mostram o mesmo assunto: o canônico aponta para o
    // histórico completo e evita concorrência entre versões da mesma página.
    alternates: { canonical },
    robots: win === "all" ? undefined : { index: false, follow: true },
    openGraph: {
      type: "website",
      locale: "pt_BR",
      url: canonical,
      siteName: "Dezena",
      title: `Números que mais saem na ${cfg.name}`,
      description,
      images: [
        {
          url: "/og.png",
          width: 1200,
          height: 630,
          alt: `Dezena — análise estatística da ${cfg.name}`,
        },
      ],
    },
  };
}

function JsonLd({
  lottery,
  data,
}: {
  lottery: string;
  data: AnalysisResult | null;
}) {
  const cfg = getLottery(lottery as never);
  const base = "https://www.dezena.app.br";
  const blocks: unknown[] = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Início", item: `${base}/` },
        {
          "@type": "ListItem",
          position: 2,
          name: `Análise da ${cfg.name}`,
          item: `${base}/analise`,
        },
      ],
    },
  ];
  if (data) {
    blocks.push({
      "@context": "https://schema.org",
      "@type": "Dataset",
      name: `Frequência das dezenas da ${cfg.name}`,
      description: `Frequência, atraso, soma, paridade e afinidade entre dezenas calculados sobre ${data.totalDraws} concursos da ${cfg.name}, do nº ${data.range.firstContest} ao nº ${data.range.lastContest}.`,
      inLanguage: "pt-BR",
      isAccessibleForFree: true,
      creator: { "@type": "Organization", name: "Dezena", url: base },
      temporalCoverage: `${data.range.firstContest}/${data.range.lastContest}`,
    });
  }
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(blocks) }}
    />
  );
}

export default async function AnalisePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const lottery = parseLotteryParam(sp.loteria);
  const lotteryFromUrl = sp.loteria !== undefined;
  const win: AnalysisWindow = parseWindowParam(sp.janela);
  const cfg = getLottery(lottery);

  const draws = await getDraws(lottery, windowLimit(win));
  const data = draws.length > 0 ? analyze(draws, cfg) : null;

  const other = LOTTERY_LIST.find((l) => l.id !== lottery);

  return (
    <div>
      <JsonLd lottery={lottery} data={data} />

      <PageHeader
        title={`Números que mais saem na ${cfg.name}`}
        description={
          data
            ? `Frequência, atraso, somas, paridade e afinidade entre dezenas, calculados sobre os ${data.totalDraws.toLocaleString("pt-BR")} concursos já sorteados da ${cfg.name} — do nº ${data.range.firstContest} ao nº ${data.range.lastContest}.`
            : `Frequência, atraso, somas e afinidade entre dezenas da ${cfg.name}.`
        }
      />

      <AnalysisPageClient
        initialLottery={lottery}
        lotteryFromUrl={lotteryFromUrl}
        initialWindow={win}
        initialData={data}
      />

      {other && (
        <p className="mt-6 text-sm text-muted-foreground">
          Procurando a outra loteria?{" "}
          <a
            href={analysisPath(other.id, "all")}
            className="text-brand-strong underline underline-offset-4"
          >
            Ver os números que mais saem na {other.name}
          </a>
          .
        </p>
      )}
    </div>
  );
}
