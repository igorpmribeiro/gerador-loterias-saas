"use client";

import { CalendarDays, Info, Sparkles } from "lucide-react";
import type {
  SpecialAnalysis,
  SpecialNumberStat,
} from "@/lib/special-analysis";
import type { LotteryConfig } from "@/lib/lotteries";
import { Ball } from "./ball";
import { DistBar } from "./dist-bar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { brl, formatDate } from "@/lib/format";
import { heatColor } from "@/lib/heat";
import { cn } from "@/lib/utils";

/* ----------------------------- Peças ----------------------------- */

function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`;
}

function StatTile({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-xl font-semibold tracking-tight tnum">{value}</p>
      <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
        {hint}
      </p>
    </div>
  );
}

/**
 * Grade com todas as dezenas do volante: cor pela frequência na série e anel
 * de destaque em quem passou da faixa que o acaso explicaria.
 */
function SeriesGrid({ data, cfg }: { data: SpecialAnalysis; cfg: LotteryConfig }) {
  const counts = data.numbers.map((n) => n.count);
  const min = Math.min(...counts);
  const max = Math.max(...counts);
  const span = Math.max(1, max - min);
  // O volante 5×5 da Lotofácil fica espalhado demais na largura do card —
  // limitar a largura devolve o formato de volante.
  const cols =
    cfg.grid.cols === 5 ? "grid-cols-5 max-w-xs" : "grid-cols-10";

  return (
    <div className="space-y-3">
      <div className={cn("grid gap-1.5 sm:gap-2", cols)}>
        {data.numbers.map((stat) => {
          const { bg, fg } = heatColor((stat.count - min) / span);
          return (
            <div
              key={stat.number}
              className="flex flex-col items-center gap-0.5 rounded-md p-1"
              title={`Nº ${stat.number}: ${stat.count} de ${
                data.totalEditions
              } edições (${stat.percentage.toFixed(0)}%) · ${
                stat.editionsSince === 0
                  ? "saiu na última"
                  : `${plural(stat.editionsSince, "edição", "edições")} sem sair`
              }`}
            >
              <span
                className={cn(
                  "flex size-8 items-center justify-center rounded-full text-xs font-semibold tabular-nums sm:size-9",
                  stat.verdict === "acima" &&
                    "ring-2 ring-emerald-400 ring-offset-2 ring-offset-card",
                  stat.verdict === "abaixo" &&
                    "ring-2 ring-sky-400 ring-offset-2 ring-offset-card"
                )}
                style={{ background: bg, color: fg }}
              >
                {stat.number.toString().padStart(2, "0")}
              </span>
              <span className="text-[10px] tabular-nums text-muted-foreground">
                {stat.count}
              </span>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-2">
          <span className="tabular-nums">{min}x</span>
          <span
            className="h-2 w-24 rounded-full"
            style={{
              background: `linear-gradient(to right, ${heatColor(0).bg}, ${
                heatColor(0.5).bg
              }, ${heatColor(1).bg})`,
            }}
            aria-hidden
          />
          <span className="tabular-nums">{max}x</span>
        </span>
        {data.standout.length > 0 && (
          <span className="flex items-center gap-1.5">
            <span
              className="size-3 rounded-full ring-2 ring-emerald-400"
              aria-hidden
            />
            acima do acaso
          </span>
        )}
        {data.underdog.length > 0 && (
          <span className="flex items-center gap-1.5">
            <span
              className="size-3 rounded-full ring-2 ring-sky-400"
              aria-hidden
            />
            abaixo do acaso
          </span>
        )}
        {data.standout.length === 0 && data.underdog.length === 0 && (
          <span>
            Nenhuma dezena fora da faixa que o acaso explica.
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Ranking de dezenas. A barra é escalada pelo maior valor do próprio card —
 * num universo de 14 a 18 edições, escalar por percentual deixaria todas as
 * barras num toco ilegível.
 */
function RankCard({
  title,
  description,
  items,
  tone,
  metric,
  barValue,
  empty,
}: {
  title: string;
  description: string;
  items: SpecialNumberStat[];
  tone: "hot" | "cold" | "neutral";
  metric: (s: SpecialNumberStat) => string;
  barValue: (s: SpecialNumberStat) => number;
  empty?: string;
}) {
  const max = Math.max(1, ...items.map(barValue));
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {items.length === 0 ? (
          <p className="py-2 text-sm text-muted-foreground">{empty}</p>
        ) : (
          items.map((s) => (
            <div key={s.number} className="flex items-center gap-3">
              <Ball n={s.number} tone={tone} size="sm" />
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-foreground/25"
                  style={{ width: `${(barValue(s) / max) * 100}%` }}
                />
              </div>
              <span className="w-24 text-right text-xs tabular-nums text-muted-foreground">
                {metric(s)}
              </span>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

/* ----------------------------- Tela ----------------------------- */

export function SpecialView({
  data,
  cfg,
}: {
  data: SpecialAnalysis;
  cfg: LotteryConfig;
}) {
  const tone = cfg.colorVar;
  const [bandLo, bandHi] = data.numbers[0]?.chanceBand ?? [0, 0];
  const period =
    data.first && data.last
      ? `de ${data.first.year} a ${data.last.year}`
      : "—";

  return (
    <div className="flex flex-col gap-4">
      {/* Cabeçalho da série */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{cfg.name}</Badge>
            <Badge variant="warning">
              <Sparkles className="size-3" />
              Sorteio especial
            </Badge>
          </div>
          <CardTitle className="mt-2 text-xl sm:text-2xl">
            {data.series.name}
          </CardTitle>
          <CardDescription className="max-w-3xl leading-relaxed">
            {data.series.schedule} {data.series.rule}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile
            label="Edições"
            value={String(data.totalEditions)}
            hint={`Todas as edições já realizadas, ${period}`}
          />
          <StatTile
            label="Próxima edição"
            value={String(data.nextEdition.year)}
            hint={data.nextEdition.label}
          />
          <StatTile
            label="Soma média"
            value={data.sum.avg.toFixed(0)}
            hint={`Faixa mais comum: ${data.sum.idealRange[0]}–${data.sum.idealRange[1]} (mín ${data.sum.min} / máx ${data.sum.max})`}
          />
          <StatTile
            label="Repetição"
            value={data.repeats.avg.toFixed(1)}
            hint="Dezenas que se repetem de uma edição para a seguinte, em média"
          />
        </CardContent>
      </Card>

      {/* O enquadramento honesto — o que o acaso já explica */}
      <Card className="border-amber-500/30 bg-amber-500/[0.04]">
        <CardContent className="flex gap-3 py-4">
          <Info className="mt-0.5 size-4 shrink-0 text-amber-500" />
          <div className="space-y-2 text-sm leading-relaxed">
            <p>
              São só <strong className="tnum">{data.totalEditions}</strong>{" "}
              concursos — amostra pequena. Por puro acaso, cada dezena sairia{" "}
              <strong className="tnum">
                {data.expectedPerNumber.toFixed(1)}
              </strong>{" "}
              vez(es) nesse período, e qualquer contagem entre{" "}
              <strong className="tnum">{bandLo}</strong> e{" "}
              <strong className="tnum">{bandHi}</strong> aparece sozinha em 95%
              dos sorteios aleatórios. Fora desses limites é que começa a valer
              o olhar.
            </p>
            <p className="text-muted-foreground">
              Nesta série,{" "}
              <strong className="text-foreground tnum">
                {data.standout.length}
              </strong>{" "}
              dezena(s) saíram acima dessa faixa e{" "}
              <strong className="text-foreground tnum">
                {data.underdog.length}
              </strong>{" "}
              abaixo. O resto é variação normal — inclusive as que parecem
              quentes.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Frequência de cada dezena na série */}
      <Card>
        <CardHeader>
          <CardTitle>Frequência dezena a dezena</CardTitle>
          <CardDescription>
            Quantas vezes cada número saiu nas {data.totalEditions} edições da{" "}
            {data.series.name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SeriesGrid data={data} cfg={cfg} />
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <RankCard
          title="Mais sorteadas"
          description="Maior presença nas edições especiais"
          items={data.hot}
          tone="hot"
          metric={(s) => `${s.count}/${data.totalEditions}`}
          barValue={(s) => s.count}
        />
        <RankCard
          title={data.never.length > 0 ? "Nunca sorteadas" : "Menos sorteadas"}
          description={
            data.never.length > 0
              ? "Ainda não apareceram em nenhuma edição"
              : "Menor presença nas edições especiais"
          }
          items={data.never.length > 0 ? data.never : data.cold}
          tone="cold"
          metric={(s) =>
            data.never.length > 0
              ? `0/${data.totalEditions}`
              : `${s.count}/${data.totalEditions}`
          }
          barValue={(s) => (data.never.length > 0 ? 1 : s.count)}
        />
        <RankCard
          title="Mais atrasadas"
          description="Edições seguidas sem serem sorteadas"
          items={data.overdue}
          tone="neutral"
          metric={(s) => plural(s.editionsSince, "edição", "edições")}
          barValue={(s) => s.editionsSince}
        />
      </div>

      {/* Especial × comum */}
      <Card>
        <CardHeader>
          <CardTitle>Especial × sorteios comuns</CardTitle>
          <CardDescription>
            Dezenas que aparecem com mais força na {data.series.name} do que
            nos {data.regularDraws.toLocaleString("pt-BR")} concursos comuns da{" "}
            {cfg.name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-secondary/50 text-xs text-muted-foreground">
                  <th className="px-3 py-2 text-left font-medium">Dezena</th>
                  <th className="px-3 py-2 text-right font-medium">
                    Na {data.series.shortName}
                  </th>
                  <th className="px-3 py-2 text-right font-medium">
                    Nos comuns
                  </th>
                  <th className="px-3 py-2 text-right font-medium">Índice</th>
                  <th className="px-3 py-2 text-right font-medium">Leitura</th>
                </tr>
              </thead>
              <tbody>
                {data.topLift.map((s) => (
                  <tr key={s.number} className="border-b last:border-0">
                    <td className="px-3 py-2">
                      <Ball n={s.number} tone={tone} size="xs" />
                    </td>
                    <td className="px-3 py-2 text-right tnum">
                      {s.percentage.toFixed(0)}%{" "}
                      <span className="text-xs text-muted-foreground">
                        ({s.count}/{data.totalEditions})
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right tnum text-muted-foreground">
                      {s.regularPercentage.toFixed(1)}%
                    </td>
                    <td className="px-3 py-2 text-right tnum">
                      {s.lift.toFixed(2)}×
                    </td>
                    <td className="px-3 py-2 text-right">
                      {s.verdict === "acima" ? (
                        <Badge variant="success">acima do acaso</Badge>
                      ) : (
                        <Badge variant="outline">dentro do acaso</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            O índice compara a taxa na série com a taxa nos concursos comuns:
            1,00× significa exatamente o mesmo comportamento. Com poucas
            edições, valores altos são esperados mesmo sem nenhuma tendência
            real — por isso a coluna de leitura.
          </p>
        </CardContent>
      </Card>

      {/* Perfil do sorteio */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Soma das dezenas</CardTitle>
            <CardDescription>
              Média {data.sum.avg.toFixed(0)} · a maioria das edições entre{" "}
              {data.sum.idealRange[0]} e {data.sum.idealRange[1]}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DistBar data={data.sum.distribution} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pares x Ímpares</CardTitle>
            <CardDescription>
              Combinação mais comum: {data.parity.mostCommon}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DistBar data={data.parity.distribution} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Repetições da edição anterior</CardTitle>
            <CardDescription>
              Quantas dezenas se repetem de uma {data.series.shortName} para a
              seguinte — média de {data.repeats.avg.toFixed(1)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DistBar data={data.repeats.distribution} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Números primos</CardTitle>
            <CardDescription>
              Média de {data.primes.avg.toFixed(1)} primos por edição
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DistBar data={data.primes.distribution} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sequências consecutivas</CardTitle>
            <CardDescription>
              Média de {data.consecutive.avg.toFixed(1)} pares consecutivos por
              edição
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DistBar data={data.consecutive.distribution} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribuição por faixa</CardTitle>
            <CardDescription>Dezenas por grupo de 10</CardDescription>
          </CardHeader>
          <CardContent>
            <DistBar data={data.ranges} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Zonas do volante</CardTitle>
            <CardDescription>
              {data.frame
                ? `Distribuição por linha e coluna · média de ${data.frame.avg.toFixed(
                    1
                  )} dezenas na moldura`
                : "Distribuição por linha e coluna"}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                Linhas
              </p>
              <DistBar data={data.zones.rows} />
            </div>
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                Colunas
              </p>
              <DistBar data={data.zones.cols} />
            </div>
            {data.frame && (
              <div className="sm:col-span-2">
                <p className="mb-2 text-xs font-medium text-muted-foreground">
                  Moldura x miolo
                </p>
                <DistBar data={data.frame.distribution} />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Duplas mais frequentes</CardTitle>
            <CardDescription>
              Pares de dezenas que mais saíram juntos nas edições especiais
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {data.pairs.map((p) => (
                <div
                  key={`${p.a}-${p.b}`}
                  className="flex items-center gap-1.5 rounded-lg border bg-card px-2 py-1.5"
                >
                  <Ball n={p.a} tone="neutral" size="sm" />
                  <Ball n={p.b} tone="neutral" size="sm" />
                  <span className="ml-1 text-xs tabular-nums text-muted-foreground">
                    {p.count}x
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Todas as edições */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle>Todas as edições</CardTitle>
              <CardDescription>
                Cada {data.series.name} já sorteada, da mais recente para a
                primeira
              </CardDescription>
            </div>
            <Badge variant="secondary">
              <CalendarDays className="size-3" />
              {data.totalEditions} edições
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-secondary/50 text-xs text-muted-foreground">
                  <th className="px-3 py-2 text-left font-medium">Ano</th>
                  <th className="px-3 py-2 text-left font-medium">Concurso</th>
                  <th className="px-3 py-2 text-left font-medium">Data</th>
                  <th className="px-3 py-2 text-left font-medium">Dezenas</th>
                  <th className="px-3 py-2 text-right font-medium">Soma</th>
                  <th className="px-3 py-2 text-right font-medium">P/Í</th>
                  <th className="px-3 py-2 text-right font-medium">Rep.</th>
                  <th className="px-3 py-2 text-right font-medium">
                    Ganhadores
                  </th>
                  <th className="px-3 py-2 text-right font-medium">
                    Prêmio por ganhador
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.editions.map((e) => (
                  <tr key={e.contest} className="border-b last:border-0">
                    <td className="px-3 py-2 font-medium tnum">{e.year}</td>
                    <td className="px-3 py-2 tnum text-muted-foreground">
                      {e.contest}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 tnum text-muted-foreground">
                      {formatDate(e.date)}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-1">
                        {e.numbers.map((n) => (
                          <Ball key={n} n={n} tone={tone} size="xs" />
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-right tnum">{e.sum}</td>
                    <td className="px-3 py-2 text-right tnum text-muted-foreground">
                      {e.even}/{e.odd}
                    </td>
                    <td className="px-3 py-2 text-right tnum text-muted-foreground">
                      {e.repeatsFromPrevious ?? "—"}
                    </td>
                    <td className="px-3 py-2 text-right tnum">
                      {e.winners === null
                        ? "—"
                        : e.winners === 0
                          ? "acumulou"
                          : e.winners.toLocaleString("pt-BR")}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-right tnum">
                      {e.prizePerWinner ? brl(e.prizePerWinner) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            &ldquo;Rep.&rdquo; é quantas dezenas se repetiram em relação à
            edição anterior da série. A premiação mostrada é a da faixa
            principal ({cfg.prizeTiers[0].label}).
          </p>
        </CardContent>
      </Card>

      <p className="text-xs leading-relaxed text-muted-foreground">
        Sorteios especiais mudam o prêmio, não a física do globo: cada dezena
        continua com a mesma chance em toda edição, e as {data.totalEditions}{" "}
        edições aqui não preveem a próxima. Estes números descrevem o que já
        aconteceu — use como referência para montar seus jogos, não como
        aposta certa. Jogue com responsabilidade.
      </p>
    </div>
  );
}
