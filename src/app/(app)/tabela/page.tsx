import type { Metadata } from "next";
import { getDraws } from "@/lib/db";
import { getLottery, LOTTERY_LIST } from "@/lib/lotteries";
import { buildDrawTable } from "@/lib/draw-table";
import { parseLotteryParam } from "@/lib/analysis-window";
import { PageHeader } from "@/components/page-header";
import { TablePageClient } from "@/components/table-page-client";
import { TABLE_LIMIT } from "@/components/table-view";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function canonicalFor(lottery: string): string {
  return lottery === "megasena" ? "/tabela" : `/tabela?loteria=${lottery}`;
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  const sp = await searchParams;
  const lottery = parseLotteryParam(sp.loteria);
  const cfg = getLottery(lottery);
  const canonical = canonicalFor(lottery);
  const description = `Os últimos concursos da ${cfg.name} em tabela: dezenas sorteadas, soma, paridade, primos e sequências. Dados oficiais da Caixa, atualizados a cada sorteio.`;

  return {
    title: {
      absolute: `Tabela de concursos da ${cfg.name}: resultados e padrões · Dezena`,
    },
    description,
    alternates: { canonical },
    openGraph: {
      type: "website",
      locale: "pt_BR",
      url: canonical,
      siteName: "Dezena",
      title: `Tabela de concursos da ${cfg.name}`,
      description,
      images: [
        {
          url: "/og.png",
          width: 1200,
          height: 630,
          alt: `Dezena — tabela de concursos da ${cfg.name}`,
        },
      ],
    },
  };
}

export default async function TabelaPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const lottery = parseLotteryParam(sp.loteria);
  const lotteryFromUrl = sp.loteria !== undefined;
  const cfg = getLottery(lottery);

  const draws = await getDraws(lottery);
  const table = draws.length > 0 ? buildDrawTable(draws, cfg) : null;
  const initialData = table
    ? {
        lottery: table.lottery,
        rows: table.rows.slice(0, TABLE_LIMIT),
        cycle: table.cycle,
      }
    : null;

  const other = LOTTERY_LIST.find((l) => l.id !== lottery);

  return (
    <div>
      <PageHeader
        title={`Tabela de concursos da ${cfg.name}`}
        description={`Os ${TABLE_LIMIT} últimos concursos da ${cfg.name} com dezenas sorteadas, soma, paridade, primos e sequências — concurso a concurso.`}
      />

      <TablePageClient
        initialLottery={lottery}
        lotteryFromUrl={lotteryFromUrl}
        initialData={initialData}
      />

      {other && (
        <p className="mt-6 text-sm text-muted-foreground">
          Ver também a{" "}
          <a
            href={canonicalFor(other.id)}
            className="text-brand-strong underline underline-offset-4"
          >
            tabela de concursos da {other.name}
          </a>
          .
        </p>
      )}
    </div>
  );
}
