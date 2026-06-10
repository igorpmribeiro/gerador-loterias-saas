"use client";

import { useState } from "react";
import {
  ClipboardCheck,
  Loader2,
  Eraser,
  Trophy,
  Sparkles,
  Target,
} from "lucide-react";
import type { LotteryConfig } from "@/lib/lotteries";
import type {
  GameCheck,
  GameEvaluation,
  MetricEvaluation,
  Verdict,
} from "@/lib/evaluator";
import type { DistributionBucket } from "@/lib/analysis";
import { Ball } from "./ball";
import { LotterySlip } from "./lottery-slip";
import { InfoPanel } from "./info-panel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SaveGameCard } from "./save-game-card";

interface EvaluateResult {
  evaluation: GameEvaluation;
  check: GameCheck;
}

function formatDate(iso: string): string {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : iso;
}

/* --------------------------- Veredito --------------------------- */

const VERDICT_META: Record<
  Verdict,
  { label: string; dot: string; text: string }
> = {
  tipico: {
    label: "típico",
    dot: "bg-emerald-500",
    text: "text-emerald-600 dark:text-emerald-400",
  },
  aceitavel: {
    label: "aceitável",
    dot: "bg-amber-500",
    text: "text-amber-600 dark:text-amber-400",
  },
  atipico: {
    label: "atípico",
    dot: "bg-rose-500",
    text: "text-rose-600 dark:text-rose-400",
  },
};

function VerdictBadge({ verdict }: { verdict: Verdict }) {
  const m = VERDICT_META[verdict];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium ${m.text}`}
    >
      <span className={`size-1.5 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  );
}

function affinityTone(c: number): string {
  if (c >= 70) return "bg-emerald-500";
  if (c >= 45) return "bg-amber-500";
  return "bg-rose-500";
}

/* --------------------------- Barra de distribuição --------------------------- */

/** Barras de distribuição com o bucket do jogo do cliente destacado. */
function MetricBar({
  data,
  gameValue,
  accent = "bg-primary",
}: {
  data: DistributionBucket[];
  gameValue: number;
  accent?: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <div className="flex flex-col gap-1.5">
      {data.map((d) => {
        const isGame = d.value === gameValue;
        return (
          <div key={d.label} className="flex items-center gap-2 text-xs">
            <span
              className={`w-24 shrink-0 tabular-nums ${
                isGame
                  ? "font-semibold text-foreground"
                  : "text-muted-foreground"
              }`}
            >
              {d.label}
            </span>
            <div className="relative h-5 flex-1 overflow-hidden rounded bg-muted">
              <div
                className={`h-full rounded transition-all ${accent} ${
                  isGame ? "opacity-100" : "opacity-40"
                }`}
                style={{ width: `${(d.count / max) * 100}%` }}
              />
            </div>
            <span
              className={`w-20 shrink-0 text-right tabular-nums ${
                isGame
                  ? "font-semibold text-foreground"
                  : "text-muted-foreground"
              }`}
            >
              {isGame ? "◀ " : ""}
              {d.percentage.toFixed(1)}%
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* --------------------------- Painel: Avaliação --------------------------- */

function MetricCard({ metric }: { metric: MetricEvaluation }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle>{metric.label}</CardTitle>
            <CardDescription>{metric.description}</CardDescription>
          </div>
          <VerdictBadge verdict={metric.verdict} />
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-sm">
          <span className="font-semibold">Seu jogo: {metric.valueLabel}</span>
          <span className="text-muted-foreground">
            — aparece em {metric.historicalShare.toFixed(1)}% dos concursos.
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          Padrão mais comum: <strong>{metric.topValueLabel}</strong> (
          {metric.topShare.toFixed(1)}% dos sorteios).
        </p>
        <MetricBar data={metric.distribution} gameValue={metric.value} />
      </CardContent>
    </Card>
  );
}

function EvaluationPanel({
  evaluation,
  cfg,
}: {
  evaluation: GameEvaluation;
  cfg: LotteryConfig;
}) {
  const { sum } = evaluation;
  const lastSet = new Set(evaluation.lastDraw);

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle>Afinidade com o modelo</CardTitle>
              <CardDescription>
                O quanto o seu jogo segue os padrões aprendidos com{" "}
                {evaluation.totalDraws} concursos da {cfg.name}.
              </CardDescription>
            </div>
            <Sparkles className="size-5 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-1.5">
            {evaluation.numbers.map((n) => (
              <Ball key={n} n={n} tone={cfg.colorVar} size="md" />
            ))}
          </div>
          <div className="flex items-center gap-3">
            <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full ${affinityTone(
                  evaluation.affinity
                )}`}
                style={{ width: `${evaluation.affinity}%` }}
              />
            </div>
            <span className="w-12 text-right text-lg font-semibold tabular-nums">
              {evaluation.affinity}%
            </span>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            A afinidade mede a aderência do jogo ao perfil estatístico
            histórico — <strong>não</strong> representa chance de ganhar.
            Todo sorteio é aleatório e independente.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <div>
              <CardTitle>Soma das dezenas</CardTitle>
              <CardDescription>
                Soma do seu jogo: <strong>{sum.value}</strong> · média
                histórica {sum.mean.toFixed(0)} · faixa típica{" "}
                {sum.idealRange[0]}–{sum.idealRange[1]} (mín {sum.min} / máx{" "}
                {sum.max})
              </CardDescription>
            </div>
            <VerdictBadge verdict={sum.verdict} />
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-xs text-muted-foreground">
            A soma do seu jogo é maior ou igual à de{" "}
            <strong>{sum.percentile.toFixed(0)}%</strong> dos concursos já
            realizados.
          </p>
          <MetricBar
            data={sum.distribution}
            gameValue={sum.gameBucket}
            accent="bg-chart-1"
          />
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {evaluation.metrics.map((m) => (
          <MetricCard key={m.key} metric={m} />
        ))}
      </div>

      {evaluation.lastContest != null && (
        <Card>
          <CardHeader>
            <CardTitle>Último sorteio — concurso {evaluation.lastContest}</CardTitle>
            <CardDescription>
              As dezenas marcadas em destaque também saíram no concurso mais
              recente.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1.5">
              {evaluation.lastDraw.map((n) => (
                <Ball
                  key={n}
                  n={n}
                  tone={lastSet.has(n) && evaluation.numbers.includes(n)
                    ? cfg.colorVar
                    : "muted"}
                  size="sm"
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <p className="text-xs leading-relaxed text-muted-foreground">
        Estas métricas descrevem apenas o comportamento histórico dos
        números. Um jogo &quot;atípico&quot; não tem menos chance de ser
        sorteado — todas as combinações são igualmente prováveis. Jogue com
        responsabilidade.
      </p>
    </div>
  );
}

/* --------------------------- Painel: Checagem --------------------------- */

function CheckPanel({
  check,
  cfg,
}: {
  check: GameCheck;
  cfg: LotteryConfig;
}) {
  const [showAll, setShowAll] = useState(false);
  const VISIBLE = 24;
  const visible = showAll
    ? check.prizedDraws
    : check.prizedDraws.slice(0, VISIBLE);
  const totalPrizes = check.prizedDraws.length;

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle>Esse jogo já foi premiado?</CardTitle>
              <CardDescription>
                Comparação das suas dezenas com os {check.totalDraws}{" "}
                concursos já realizados da {cfg.name}.
              </CardDescription>
            </div>
            <Trophy className="size-5 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-1.5">
            {check.numbers.map((n) => (
              <Ball key={n} n={n} tone={cfg.colorVar} size="md" />
            ))}
          </div>
          <div
            className={`rounded-lg border px-4 py-3 text-sm ${
              check.everPrized
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                : "border-border bg-secondary/50 text-muted-foreground"
            }`}
          >
            {check.everPrized ? (
              <>
                Esse jogo teria batido alguma faixa de premiação{" "}
                <strong>{totalPrizes}</strong>{" "}
                {totalPrizes === 1 ? "vez" : "vezes"} ao longo da história da{" "}
                {cfg.name}.
              </>
            ) : (
              <>
                Esse jogo <strong>nunca</strong> teria sido premiado em nenhum
                concurso passado da {cfg.name}.
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        {check.tiers.map((t) => (
          <div
            key={t.hits}
            className="flex min-w-[140px] flex-1 flex-col gap-1 rounded-xl border bg-card p-4"
          >
            <span className="text-xs font-medium text-muted-foreground">
              {t.label}
            </span>
            <span className="text-2xl font-semibold tabular-nums">
              {t.occurrences}
            </span>
            <span className="text-xs text-muted-foreground">
              {t.occurrences === 1 ? "concurso" : "concursos"} · {t.hits}{" "}
              acertos
            </span>
          </div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Melhor resultado</CardTitle>
            <CardDescription>
              Maior número de acertos que o jogo já obteve.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {check.best ? (
              <div className="flex items-center gap-3">
                <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-secondary">
                  <span className="text-xl font-semibold tabular-nums">
                    {check.best.hits}
                  </span>
                </div>
                <div className="text-sm">
                  <p className="font-medium">
                    {check.best.hits}{" "}
                    {check.best.hits === 1 ? "acerto" : "acertos"}
                  </p>
                  <p className="text-muted-foreground tabular-nums">
                    concurso {check.best.contest} ·{" "}
                    {formatDate(check.best.date)}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Sem dados suficientes.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribuição de acertos</CardTitle>
            <CardDescription>
              Em quantos concursos o jogo fez cada número de acertos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-1.5">
              {check.hitDistribution
                .filter((d) => d.count > 0)
                .map((d) => {
                  const max = Math.max(
                    1,
                    ...check.hitDistribution.map((x) => x.count)
                  );
                  return (
                    <div
                      key={d.value}
                      className="flex items-center gap-2 text-xs"
                    >
                      <span className="w-20 shrink-0 tabular-nums text-muted-foreground">
                        {d.label}
                      </span>
                      <div className="relative h-5 flex-1 overflow-hidden rounded bg-muted">
                        <div
                          className="h-full rounded bg-chart-2 transition-all"
                          style={{ width: `${(d.count / max) * 100}%` }}
                        />
                      </div>
                      <span className="w-20 shrink-0 text-right tabular-nums text-muted-foreground">
                        {d.count}×
                      </span>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      </div>

      {totalPrizes > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Concursos em que o jogo teria premiado</CardTitle>
            <CardDescription>
              {totalPrizes} {totalPrizes === 1 ? "concurso" : "concursos"} — do
              mais recente ao mais antigo. As bolas destacadas são as dezenas
              que coincidiram.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {visible.map((d) => {
              const matched = new Set(d.matched);
              return (
                <div
                  key={d.contest}
                  className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b py-2.5 last:border-b-0"
                >
                  <div className="w-32 shrink-0">
                    <p className="text-sm font-semibold tabular-nums">
                      Concurso {d.contest}
                    </p>
                    <p className="text-xs text-muted-foreground tabular-nums">
                      {formatDate(d.date)}
                    </p>
                  </div>
                  <Badge variant="secondary">{d.tierLabel}</Badge>
                  <div className="flex flex-wrap gap-1.5">
                    {check.numbers.map((n) => (
                      <Ball
                        key={n}
                        n={n}
                        tone={matched.has(n) ? cfg.colorVar : "muted"}
                        size="sm"
                      />
                    ))}
                  </div>
                </div>
              );
            })}
            {totalPrizes > VISIBLE && (
              <Button
                variant="outline"
                size="sm"
                className="mt-1 self-start"
                onClick={() => setShowAll((v) => !v)}
              >
                {showAll
                  ? "Mostrar menos"
                  : `Ver todos os ${totalPrizes} concursos`}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <p className="text-xs leading-relaxed text-muted-foreground">
        Resultados passados não se repetem nem aumentam as chances de um jogo.
        Esta checagem é apenas uma curiosidade estatística sobre o histórico.
        Jogue com responsabilidade.
      </p>
    </div>
  );
}

/* --------------------------- Componente principal --------------------------- */

export function EvaluatorView({ cfg }: { cfg: LotteryConfig }) {
  const [selected, setSelected] = useState<number[]>([]);
  const [result, setResult] = useState<EvaluateResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const complete = selected.length === cfg.drawSize;

  function toggle(n: number) {
    setSelected((prev) =>
      prev.includes(n)
        ? prev.filter((x) => x !== n)
        : prev.length >= cfg.drawSize
          ? prev
          : [...prev, n]
    );
  }

  function clear() {
    setSelected([]);
    setResult(null);
    setError(null);
  }

  async function evaluate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lottery: cfg.id, numbers: selected }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "falha ao avaliar");
      setResult({ evaluation: json.evaluation, check: json.check });
    } catch (err) {
      setError(err instanceof Error ? err.message : "erro inesperado");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <InfoPanel title="Como funciona o avaliador">
        <ul className="ml-4 list-disc space-y-1">
          <li>
            Marque <strong>exatamente {cfg.drawSize} dezenas</strong> no
            volante abaixo — é a aposta simples da {cfg.name}.
          </li>
          <li>
            A aba <strong>Avaliação</strong> mostra como o seu jogo se compara
            aos padrões históricos: pares/ímpares, soma, primos, moldura,
            sequências e repetições do último sorteio.
          </li>
          <li>
            A aba <strong>Já foi premiado?</strong> compara o seu jogo com
            todos os concursos passados e mostra em quantos ele teria batido
            uma faixa de premiação.
          </li>
          <li>
            Nada aqui prevê resultados: todo sorteio é aleatório e
            independente. As análises servem apenas para embasar a sua
            escolha.
          </li>
        </ul>
      </InfoPanel>

      <Card>
        <CardHeader>
          <CardTitle>Monte o seu jogo — {cfg.name}</CardTitle>
          <CardDescription>
            Preencha o volante marcando as dezenas da sua aposta.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <LotterySlip
            cfg={cfg}
            selected={selected}
            onToggle={toggle}
            disabled={loading}
          />

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-sm">
              <Target className="size-4 text-muted-foreground" />
              <span
                className={
                  complete
                    ? "font-semibold text-foreground"
                    : "text-muted-foreground"
                }
              >
                {selected.length} de {cfg.drawSize} dezenas marcadas
              </span>
            </div>
            <div className="ml-auto flex flex-wrap items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={clear}
                disabled={loading || (selected.length === 0 && !result)}
              >
                <Eraser className="size-4" />
                Limpar
              </Button>
              <Button onClick={evaluate} disabled={loading || !complete}>
                {loading ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <ClipboardCheck />
                )}
                {loading ? "Avaliando..." : "Avaliar jogo"}
              </Button>
            </div>
          </div>

          {!complete && !error && (
            <p className="text-xs text-muted-foreground">
              Marque {cfg.drawSize - selected.length}{" "}
              {cfg.drawSize - selected.length === 1
                ? "dezena"
                : "dezenas"}{" "}
              para liberar a avaliação.
            </p>
          )}

          {error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}
        </CardContent>
      </Card>

      {result && (
        <>
          <Tabs defaultValue="avaliacao">
            <TabsList>
              <TabsTrigger value="avaliacao">
                <Sparkles />
                Avaliação completa
              </TabsTrigger>
              <TabsTrigger value="checagem">
                <Trophy />
                Já foi premiado?
              </TabsTrigger>
            </TabsList>
            <TabsContent value="avaliacao">
              <EvaluationPanel evaluation={result.evaluation} cfg={cfg} />
            </TabsContent>
            <TabsContent value="checagem">
              <CheckPanel check={result.check} cfg={cfg} />
            </TabsContent>
          </Tabs>

          <SaveGameCard
            cfg={cfg}
            numbers={result.evaluation.numbers}
            lastContest={result.evaluation.lastContest}
          />
        </>
      )}
    </div>
  );
}
