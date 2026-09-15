"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Dices, Sparkles } from "lucide-react";
import type { AnalysisResult } from "@/lib/analysis";
import type { LotteryConfig } from "@/lib/lotteries";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/auth-client";
import { FREE_LIMITS } from "@/lib/plans";
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
import { NumberDetailModal } from "./number-detail-modal";
import { heatColor } from "@/lib/heat";

function Heatmap({
  data,
  onSelect,
}: {
  data: AnalysisResult;
  onSelect?: (n: number) => void;
}) {
  const counts = data.numbers.map((n) => n.count);
  const min = Math.min(...counts);
  const max = Math.max(...counts);
  const span = Math.max(1, max - min);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-10 gap-1.5 sm:gap-2">
        {data.numbers.map((stat) => {
          const t = (stat.count - min) / span;
          const { bg, fg } = heatColor(t);
          const title = `Nº ${stat.number}: ${stat.count}x (${stat.percentage.toFixed(
            1
          )}%) · atraso ${stat.currentGap}`;
          const inner = (
            <>
              <span
                className="flex size-8 items-center justify-center rounded-full text-xs font-semibold tabular-nums sm:size-9"
                style={{ background: bg, color: fg }}
              >
                {stat.number.toString().padStart(2, "0")}
              </span>
              <span className="text-[10px] tabular-nums text-muted-foreground">
                {stat.count}
              </span>
            </>
          );

          if (onSelect) {
            return (
              <button
                key={stat.number}
                type="button"
                onClick={() => onSelect(stat.number)}
                title={title}
                className="flex cursor-pointer flex-col items-center gap-0.5 rounded-md p-1 outline-none transition hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring"
              >
                {inner}
              </button>
            );
          }
          return (
            <div
              key={stat.number}
              className="flex flex-col items-center gap-0.5 rounded-md p-1"
              title={title}
            >
              {inner}
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="tabular-nums">Frio · {min}x</span>
        <div
          className="h-2 flex-1 rounded-full"
          style={{
            background: `linear-gradient(to right, ${heatColor(0).bg}, ${
              heatColor(0.25).bg
            }, ${heatColor(0.5).bg}, ${heatColor(0.75).bg}, ${
              heatColor(1).bg
            })`,
          }}
          aria-hidden
        />
        <span className="tabular-nums">{max}x · Quente</span>
      </div>
      {onSelect && (
        <p className="text-[11px] text-muted-foreground">
          Clique em qualquer número para abrir a análise individual.
        </p>
      )}
    </div>
  );
}

/**
 * Ranking de dezenas. A barra é escalada pelo maior valor do próprio card:
 * escalar por percentual do total deixava todas num toco (356 de 3.057
 * concursos é 11%) e zerava por completo o card de atraso.
 */
function RankCard({
  title,
  description,
  items,
  tone,
  metric,
  barValue,
  onSelect,
}: {
  title: string;
  description: string;
  items: AnalysisResult["hot"];
  tone: "hot" | "cold" | "neutral";
  metric: (s: AnalysisResult["hot"][number]) => string;
  barValue: (s: AnalysisResult["hot"][number]) => number;
  onSelect?: (n: number) => void;
}) {
  const max = Math.max(1, ...items.map(barValue));
  return (
    <Card>
      <CardHeader>
        <CardTitle as="h2">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {items.map((s) => (
          <div key={s.number} className="flex items-center gap-3">
            <Ball
              n={s.number}
              tone={tone}
              size="sm"
              onClick={onSelect ? () => onSelect(s.number) : undefined}
            />
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-foreground/25"
                style={{ width: `${(barValue(s) / max) * 100}%` }}
              />
            </div>
            <span className="w-20 text-right text-xs tabular-nums text-muted-foreground">
              {metric(s)}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

/**
 * Convite contextual. A análise é a porta de entrada do produto — quem chega
 * aqui pelo buscador acabou de ver exatamente quais dezenas saem mais, e é
 * nesse pico de interesse que faz sentido oferecer o passo seguinte. Antes a
 * página terminava no aviso legal, sem nenhuma ação.
 */
function AnalysisCta({
  cfg,
  tone = "inline",
}: {
  cfg: LotteryConfig;
  tone?: "inline" | "closing";
}) {
  // Sem ramificar por `isPending`: o servidor e o primeiro render do cliente
  // precisam produzir a mesma árvore, senão a hidratação quebra. A versão
  // deslogada é a inicial nos dois; a sessão, quando chega, só troca o texto.
  const { data: session } = useSession();
  const signedIn = Boolean(session);
  const href = signedIn ? "/gerador" : "/register";
  const label = signedIn ? "Abrir o gerador" : "Criar conta grátis";
  const headline = signedIn
    ? `Monte um jogo da ${cfg.name} com esses padrões`
    : `Quer jogar com as dezenas da ${cfg.name}?`;
  const body = signedIn
    ? "O gerador usa frequência, atraso, tendência recente e afinidade entre dezenas — e nunca repete um jogo já sorteado na história."
    : `O gerador monta até ${FREE_LIMITS.generationsPerDay * FREE_LIMITS.gamesPerGeneration} jogos por dia de graça, respeitando os mesmos padrões que você acabou de ver. Sem cartão.`;

  if (tone === "inline") {
    return (
      <div className="flex flex-col gap-3 rounded-xl border bg-card px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <Dices
            aria-hidden
            className="mt-0.5 size-5 shrink-0 text-brand-strong"
            strokeWidth={1.75}
          />
          <div>
            <p className="text-sm font-medium">{headline}</p>
            <p className="mt-0.5 text-sm text-muted-foreground">{body}</p>
          </div>
        </div>
        <Button size="lg" className="shrink-0" asChild>
          <Link href={href}>
            {label}
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border bg-card p-6 sm:p-8">
      <h2 className="text-xl font-medium tracking-tight">{headline}</h2>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
        {body}
      </p>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button size="lg" asChild>
          <Link href={href}>
            {label}
            <ArrowRight className="size-4" />
          </Link>
        </Button>
        <Button size="lg" variant="outline" asChild>
          <Link href="/especiais">
            <Sparkles className="size-4" />
            Ver os sorteios especiais
          </Link>
        </Button>
      </div>
    </div>
  );
}

export function AnalysisView({
  data,
  cfg,
}: {
  data: AnalysisResult;
  cfg: LotteryConfig;
}) {
  const supportsDetail = cfg.id === "lotofacil";
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null);
  const select = supportsDetail ? setSelectedNumber : undefined;

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle as="h2">Quantas vezes cada dezena já saiu</CardTitle>
              <CardDescription>
                {data.totalDraws} concursos analisados (do nº{" "}
                {data.range.firstContest} ao {data.range.lastContest})
              </CardDescription>
            </div>
            <Badge variant="secondary">{cfg.name}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Heatmap data={data} onSelect={select} />
        </CardContent>
      </Card>

      <AnalysisCta cfg={cfg} />

      <div className="grid gap-4 md:grid-cols-3">
        <RankCard
          title="Dezenas que mais saem"
          description="Maior frequência no período analisado"
          items={data.hot}
          tone="hot"
          metric={(s) => `${s.count}x`}
          barValue={(s) => s.count}
          onSelect={select}
        />
        <RankCard
          title="Dezenas que menos saem"
          description="Menor frequência no período analisado"
          items={data.cold}
          tone="cold"
          metric={(s) => `${s.count}x`}
          barValue={(s) => s.count}
          onSelect={select}
        />
        <RankCard
          title="Dezenas mais atrasadas"
          description="Concursos seguidos sem serem sorteadas"
          items={data.overdue}
          tone="neutral"
          metric={(s) => `${s.currentGap} atrás`}
          barValue={(s) => s.currentGap}
          onSelect={select}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle as="h2">Soma das dezenas sorteadas</CardTitle>
            <CardDescription>
              Média {data.sum.avg.toFixed(0)} · a maioria dos concursos soma
              entre {data.sum.idealRange[0]} e {data.sum.idealRange[1]} (mín{" "}
              {data.sum.min} / máx {data.sum.max})
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DistBar data={data.sum.distribution} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle as="h2">Pares e ímpares por concurso</CardTitle>
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
            <CardTitle as="h2">Números primos por concurso</CardTitle>
            <CardDescription>
              Média de {data.primes.avg.toFixed(1)} primos por concurso
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DistBar data={data.primes.distribution} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle as="h2">Dezenas consecutivas</CardTitle>
            <CardDescription>
              Média de {data.consecutive.avg.toFixed(1)} pares consecutivos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DistBar data={data.consecutive.distribution} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle as="h2">Dezenas repetidas do concurso anterior</CardTitle>
            <CardDescription>
              Em média {data.repeats.avg.toFixed(1)} dezenas se repetem
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DistBar data={data.repeats.distribution} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle as="h2">Distribuição por faixa de dezenas</CardTitle>
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
            <CardTitle as="h2">Zonas do volante</CardTitle>
            <CardDescription>Distribuição por linha e coluna</CardDescription>
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle as="h2">Pares de dezenas que mais saem juntos</CardTitle>
            <CardDescription>
              Duplas com maior co-ocorrência histórica
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {data.pairs.map((p) => (
                <div
                  key={`${p.a}-${p.b}`}
                  className="flex items-center gap-1.5 rounded-lg border bg-card px-2 py-1.5"
                >
                  <Ball
                    n={p.a}
                    tone="neutral"
                    size="sm"
                    onClick={select ? () => select(p.a) : undefined}
                  />
                  <Ball
                    n={p.b}
                    tone="neutral"
                    size="sm"
                    onClick={select ? () => select(p.b) : undefined}
                  />
                  <span className="ml-1 text-xs tabular-nums text-muted-foreground">
                    {p.count}x
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <AnalysisCta cfg={cfg} tone="closing" />

      <p className="text-xs leading-relaxed text-muted-foreground">
        Cada sorteio é um evento independente e aleatório. Estas análises
        descrevem apenas o comportamento histórico dos números — elas ajudam
        a embasar suas escolhas, mas não preveem nem influenciam resultados
        futuros. Jogue com responsabilidade.
      </p>

      {supportsDetail && (
        <NumberDetailModal
          number={selectedNumber}
          open={selectedNumber !== null}
          onOpenChange={(o) => {
            if (!o) setSelectedNumber(null);
          }}
        />
      )}
    </div>
  );
}
