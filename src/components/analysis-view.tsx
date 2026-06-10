"use client";

import { useState } from "react";
import type { AnalysisResult } from "@/lib/analysis";
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
import { NumberDetailModal } from "./number-detail-modal";

/**
 * Rampa de calor perceptualmente uniforme em OKLCH.
 * Trajeto: azul (frio) → violeta → magenta → vermelho (quente).
 * Evita o "vale amarelo" do HSL onde texto branco fica ilegível.
 * Retorna bg e cor de texto com contraste garantido (AA 4.5:1+).
 */
function heatColor(t: number): { bg: string; fg: string } {
  const L = 0.92 - 0.5 * t; // 0.92 → 0.42 — clareza decresce monotonicamente
  const C = 0.04 + 0.2 * t; // 0.04 → 0.24
  const H = 250 + 130 * t; // 250 (azul) → 380≡20 (vermelho), passando por violeta/magenta
  const bg = `oklch(${L.toFixed(3)} ${C.toFixed(3)} ${H.toFixed(1)})`;
  // Texto escuro do tema até L=0.62; texto claro abaixo. Atende AA em toda a rampa.
  const fg =
    L > 0.62
      ? "oklch(0.22 0.015 255)"
      : "oklch(0.985 0.003 247)";
  return { bg, fg };
}

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

function RankCard({
  title,
  description,
  items,
  tone,
  metric,
  onSelect,
}: {
  title: string;
  description: string;
  items: AnalysisResult["hot"];
  tone: "hot" | "cold" | "neutral";
  metric: (s: AnalysisResult["hot"][number]) => string;
  onSelect?: (n: number) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
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
                style={{ width: `${Math.min(100, s.percentage)}%` }}
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
              <CardTitle>Mapa de calor — frequência</CardTitle>
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

      <div className="grid gap-4 md:grid-cols-3">
        <RankCard
          title="Mais quentes"
          description="Maior frequência no período"
          items={data.hot}
          tone="hot"
          metric={(s) => `${s.count}x`}
          onSelect={select}
        />
        <RankCard
          title="Mais frios"
          description="Menor frequência no período"
          items={data.cold}
          tone="cold"
          metric={(s) => `${s.count}x`}
          onSelect={select}
        />
        <RankCard
          title="Mais atrasados"
          description="Concursos sem serem sorteados"
          items={data.overdue}
          tone="neutral"
          metric={(s) => `${s.currentGap} atrás`}
          onSelect={select}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Soma das dezenas</CardTitle>
            <CardDescription>
              Média {data.sum.avg.toFixed(0)} · faixa ideal{" "}
              {data.sum.idealRange[0]}–{data.sum.idealRange[1]} (mín{" "}
              {data.sum.min} / máx {data.sum.max})
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DistBar data={data.sum.distribution} accent="bg-chart-1" />
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
            <DistBar data={data.parity.distribution} accent="bg-chart-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Números primos</CardTitle>
            <CardDescription>
              Média de {data.primes.avg.toFixed(1)} primos por concurso
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DistBar data={data.primes.distribution} accent="bg-chart-3" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sequências consecutivas</CardTitle>
            <CardDescription>
              Média de {data.consecutive.avg.toFixed(1)} pares consecutivos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DistBar data={data.consecutive.distribution} accent="bg-chart-4" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Repetições do concurso anterior</CardTitle>
            <CardDescription>
              Em média {data.repeats.avg.toFixed(1)} dezenas se repetem
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DistBar data={data.repeats.distribution} accent="bg-chart-5" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribuição por faixa</CardTitle>
            <CardDescription>Dezenas por grupo de 10</CardDescription>
          </CardHeader>
          <CardContent>
            <DistBar data={data.ranges} accent="bg-primary" />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Zonas do volante</CardTitle>
            <CardDescription>Distribuição por linha e coluna</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                Linhas
              </p>
              <DistBar data={data.zones.rows} accent="bg-chart-1" />
            </div>
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                Colunas
              </p>
              <DistBar data={data.zones.cols} accent="bg-chart-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pares que mais saem juntos</CardTitle>
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
