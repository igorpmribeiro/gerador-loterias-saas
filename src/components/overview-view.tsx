"use client";

import Link from "next/link";
import {
  ExternalLink,
  ChartColumnBig,
  Dices,
  ClipboardCheck,
  Table2,
  TriangleAlert,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import { LOTTERIES, type LotteryId } from "@/lib/lotteries";
import { useLottery } from "./lottery-context";
import { useApiResource } from "@/hooks/use-api-resource";
import { Ball } from "./ball";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface PrizeTier {
  label: string;
  winners: number;
  prize: number;
}

interface OverviewOk {
  ok: true;
  lottery: LotteryId;
  name: string;
  contest: number;
  date: string;
  numbers: number[];
  accumulated: boolean;
  nextDate: string | null;
  nextContest: number | null;
  estimatedNextPrize: number | null;
  accumulatedNextPrize: number | null;
  prizeTiers: PrizeTier[];
  drawLocation: string | null;
  totalStored: number;
}

interface OverviewFail {
  ok: false;
  lottery: LotteryId;
  name: string;
  error: string;
  totalStored: number;
}

type OverviewItem = OverviewOk | OverviewFail;

function brl(value: number, compact = false): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    notation: compact ? "compact" : "standard",
    maximumFractionDigits: compact ? 1 : 2,
  });
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : iso;
}

function LotteryPanel({ data }: { data: OverviewItem }) {
  const tone = LOTTERIES[data.lottery].colorVar;
  const accentBg = tone === "mega" ? "bg-mega" : "bg-lotofacil";
  const accentFg =
    tone === "mega" ? "text-mega-foreground" : "text-lotofacil-foreground";

  if (!data.ok) {
    return (
      <Card className="overflow-hidden">
        <div className={`flex items-center justify-between px-5 py-3 ${accentBg} ${accentFg}`}>
          <span className="font-semibold">{data.name}</span>
        </div>
        <CardContent className="flex items-center gap-3 py-8 text-sm text-muted-foreground">
          <TriangleAlert className="size-5 shrink-0 text-amber-500" />
          {data.error}. Os dados históricos seguem disponíveis nas demais
          seções.
        </CardContent>
      </Card>
    );
  }

  const topTier = data.prizeTiers[0];

  return (
    <Card className="flex flex-col overflow-hidden">
      <div
        className={`flex items-center justify-between px-5 py-3 ${accentBg} ${accentFg}`}
      >
        <span className="font-semibold">{data.name}</span>
        <span className="rounded-md bg-black/15 px-2 py-0.5 text-xs font-medium tnum">
          Concurso {data.contest}
        </span>
      </div>

      <CardContent className="flex flex-1 flex-col gap-5 pt-5">
        {/* Resultado */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Último resultado
            </span>
            <span className="text-xs text-muted-foreground tnum">
              {formatDate(data.date)}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {data.numbers.map((n) => (
              <Ball key={n} n={n} tone={tone} size="lg" />
            ))}
          </div>
        </div>

        {/* Situação do prêmio */}
        <div className="rounded-lg border bg-secondary/40 p-4">
          {data.accumulated ? (
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
                {topTier
                  ? `${topTier.winners.toLocaleString("pt-BR")} aposta(s) na faixa principal.`
                  : "Confira as faixas abaixo."}
              </p>
            </div>
          )}
        </div>

        {/* Próximo concurso */}
        <div>
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Próximo concurso
              </p>
              <p className="mt-0.5 text-sm text-muted-foreground tnum">
                {data.nextContest ? `Nº ${data.nextContest} · ` : ""}
                {formatDate(data.nextDate)}
              </p>
            </div>
          </div>
          <p className="mt-2 text-2xl font-semibold tracking-tight tnum sm:text-3xl">
            {data.estimatedNextPrize
              ? brl(data.estimatedNextPrize)
              : "A definir"}
          </p>
          <p className="text-xs text-muted-foreground">
            prêmio estimado para o próximo sorteio
          </p>
        </div>

        {/* Faixas de premiação */}
        {data.prizeTiers.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Faixas de premiação
            </p>
            <div className="overflow-hidden rounded-lg border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-secondary/50 text-xs text-muted-foreground">
                    <th className="px-3 py-2 text-left font-medium">Faixa</th>
                    <th className="px-3 py-2 text-right font-medium">
                      Ganhadores
                    </th>
                    <th className="px-3 py-2 text-right font-medium">
                      Prêmio
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.prizeTiers.map((t, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="px-3 py-2">{t.label}</td>
                      <td className="px-3 py-2 text-right tnum">
                        {t.winners.toLocaleString("pt-BR")}
                      </td>
                      <td className="px-3 py-2 text-right tnum">
                        {t.prize > 0 ? brl(t.prize) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-1">
          <span className="text-xs text-muted-foreground">
            {data.totalStored.toLocaleString("pt-BR")} concursos analisados
          </span>
          <Button asChild variant="outline" size="sm">
            <a
              href="https://loterias.caixa.gov.br/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink />
              Apostar na Caixa
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function QuickLink({
  href,
  icon: Icon,
  title,
  description,
}: {
  href: string;
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 rounded-lg border bg-card p-4 transition-colors hover:bg-secondary/50"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-secondary text-foreground">
        <Icon className="size-5" />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold">{title}</p>
        <p className="truncate text-xs text-muted-foreground">{description}</p>
      </div>
      <ArrowRight className="ml-auto size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

export function OverviewView() {
  const { dataVersion } = useLottery();
  const { data, loading, error } = useApiResource<{
    lotteries: OverviewItem[];
  }>("/api/overview", dataVersion);
  const items = data?.lotteries ?? null;

  return (
    <div>
      {error && (
        <p className="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        {items && !loading
          ? items.map((it) => <LotteryPanel key={it.lottery} data={it} />)
          : [0, 1].map((i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="h-11 w-full rounded-none" />
                <CardContent className="space-y-4 pt-5">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-32 w-full" />
                </CardContent>
              </Card>
            ))}
      </div>

      <div className="mt-8">
        <h2 className="mb-1 text-base font-semibold tracking-tight">
          Ferramentas da plataforma
        </h2>
        <p className="mb-3 text-sm text-muted-foreground">
          Explore os dados e monte seus jogos antes de apostar.
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <QuickLink
            href="/analise"
            icon={ChartColumnBig}
            title="Análise"
            description="Frequência, atrasos e padrões dos sorteios"
          />
          <QuickLink
            href="/gerador"
            icon={Dices}
            title="Gerador"
            description="Jogos por modelo estatístico e fechamentos"
          />
          <QuickLink
            href="/avaliador"
            icon={ClipboardCheck}
            title="Avaliador"
            description="Avalie seu jogo e veja se ele já premiou"
          />
          <QuickLink
            href="/tabela"
            icon={Table2}
            title="Tabela"
            description="Os 20 últimos concursos com métricas"
          />
        </div>
      </div>
    </div>
  );
}
