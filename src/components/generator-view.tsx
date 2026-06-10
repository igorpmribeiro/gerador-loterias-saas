"use client";

import { useState } from "react";
import Link from "next/link";
import { Dices, Loader2, Copy, Check } from "lucide-react";
import type { GeneratedGame, Strategy } from "@/lib/generator";
import type { LotteryConfig } from "@/lib/lotteries";
import { Ball } from "./ball";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { InfoPanel } from "./info-panel";

const STRATEGIES: { id: Strategy; label: string; hint: string }[] = [
  {
    id: "ml",
    label: "Machine Learning",
    hint: "Modelo completo: combina frequência, atraso, co-ocorrência e otimização.",
  },
  {
    id: "balanced",
    label: "Equilibrado",
    hint: "Mistura dezenas quentes, frias e atrasadas de forma proporcional.",
  },
  {
    id: "hot",
    label: "Números quentes",
    hint: "Dá preferência às dezenas mais sorteadas no período.",
  },
  {
    id: "overdue",
    label: "Atrasados",
    hint: "Dá preferência às dezenas que estão há mais tempo sem sair.",
  },
  {
    id: "random",
    label: "Surpresinha",
    hint: "Sorteio totalmente aleatório, sem nenhum viés estatístico.",
  },
];

function confidenceTone(c: number): string {
  if (c >= 70) return "bg-emerald-500";
  if (c >= 45) return "bg-amber-500";
  return "bg-rose-500";
}

function GameCard({
  game,
  index,
  tone,
}: {
  game: GeneratedGame;
  index: number;
  tone: "mega" | "lotofacil";
}) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(
      game.numbers.map((n) => n.toString().padStart(2, "0")).join(" ")
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">
          Jogo {index + 1}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">afinidade</span>
          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full rounded-full ${confidenceTone(
                game.confidence
              )}`}
              style={{ width: `${game.confidence}%` }}
            />
          </div>
          <span className="w-9 text-right text-xs font-semibold tabular-nums">
            {game.confidence}%
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={copy}
            aria-label="Copiar jogo"
          >
            {copied ? (
              <Check className="size-3.5 text-emerald-500" />
            ) : (
              <Copy className="size-3.5" />
            )}
          </Button>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {game.numbers.map((n) => (
          <Ball key={n} n={n} tone={tone} size="md" />
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span>soma {game.metrics.sum}</span>
        <span>
          {game.metrics.even}P / {game.metrics.odd}Í
        </span>
        <span>{game.metrics.primes} primos</span>
        <span>{game.metrics.consecutive} consecutivos</span>
        <span>{game.metrics.repeatsFromLast} repetem o último</span>
      </div>
    </div>
  );
}

export function GeneratorView({ cfg }: { cfg: LotteryConfig }) {
  const [strategy, setStrategy] = useState<Strategy>("ml");
  const [picks, setPicks] = useState(cfg.drawSize);
  const [count, setCount] = useState(5);
  const [windowSize, setWindowSize] = useState("500");
  const [games, setGames] = useState<GeneratedGame[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [trainedOn, setTrainedOn] = useState<number | null>(null);

  const pickOptions: number[] = [];
  for (let p = cfg.pickMin; p <= cfg.pickMax; p++) pickOptions.push(p);

  async function generate() {
    setLoading(true);
    setError(null);
    setNeedsLogin(false);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lottery: cfg.id,
          strategy,
          picks,
          count,
          window: windowSize === "all" ? "all" : Number(windowSize),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        if (json.code === "auth") setNeedsLogin(true);
        throw new Error(json.error ?? "falha ao gerar");
      }
      setGames(json.games);
      setTrainedOn(json.trainedOn);
    } catch (err) {
      setError(err instanceof Error ? err.message : "erro inesperado");
      setGames([]);
    } finally {
      setLoading(false);
    }
  }

  const activeStrategy = STRATEGIES.find((s) => s.id === strategy)!;
  const tone = cfg.colorVar;

  return (
    <div className="flex flex-col gap-4">
      <InfoPanel title="Como aproveitar melhor o gerador">
        <ul className="ml-4 list-disc space-y-1">
          <li>
            <strong>Estratégia:</strong> a opção <em>Machine Learning</em> usa o
            modelo completo; as demais focam num critério específico (quentes,
            atrasados ou equilíbrio). <em>Surpresinha</em> é puramente aleatória.
          </li>
          <li>
            <strong>Janela de treino:</strong> janelas curtas captam a fase
            recente dos sorteios; o histórico completo é mais estável. Vale
            testar as duas e comparar.
          </li>
          <li>
            A <strong>afinidade</strong> indica o quanto o jogo segue os padrões
            aprendidos pelo modelo — <strong>não</strong> é probabilidade de
            ganhar.
          </li>
          <li>
            Gere vários jogos e compare as métricas (soma, pares/ímpares,
            primos) com o que a aba <em>Análise</em> aponta como mais comum.
          </li>
        </ul>
      </InfoPanel>

      <Card>
        <CardHeader>
          <CardTitle>Gerador inteligente de jogos</CardTitle>
          <CardDescription>
            Os jogos são montados por um modelo treinado com o histórico de{" "}
            {cfg.name}, combinando frequência das dezenas, tempo de atraso,
            co-ocorrência entre números e ajuste fino por otimização.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">
                Estratégia
              </span>
              <Select
                value={strategy}
                onValueChange={(v) => setStrategy(v as Strategy)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STRATEGIES.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">
                Dezenas por jogo
              </span>
              <Select
                value={String(picks)}
                onValueChange={(v) => setPicks(Number(v))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {pickOptions.map((p) => (
                    <SelectItem key={p} value={String(p)}>
                      {p} dezenas
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">
                Quantidade de jogos
              </span>
              <Select
                value={String(count)}
                onValueChange={(v) => setCount(Number(v))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 3, 5, 8, 10, 15, 20].map((c) => (
                    <SelectItem key={c} value={String(c)}>
                      {c} {c === 1 ? "jogo" : "jogos"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">
                Janela de treino
              </span>
              <Select value={windowSize} onValueChange={setWindowSize}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="100">100 concursos</SelectItem>
                  <SelectItem value="300">300 concursos</SelectItem>
                  <SelectItem value="500">500 concursos</SelectItem>
                  <SelectItem value="1000">1000 concursos</SelectItem>
                  <SelectItem value="all">Histórico completo</SelectItem>
                </SelectContent>
              </Select>
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={generate} disabled={loading} size="lg">
              {loading ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Dices />
              )}
              {loading ? "Gerando..." : "Gerar jogos"}
            </Button>
            <p className="text-xs text-muted-foreground">
              {activeStrategy.hint}
            </p>
          </div>

          {error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
              {needsLogin && (
                <>
                  {" "}
                  <Link
                    href="/login?next=/gerador"
                    className="font-medium underline underline-offset-4"
                  >
                    Entrar
                  </Link>
                </>
              )}
            </p>
          )}
        </CardContent>
      </Card>

      {games.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">
              {games.length} {games.length === 1 ? "jogo gerado" : "jogos gerados"}
            </h3>
            {trainedOn != null && (
              <Badge variant="secondary">
                modelo treinado com {trainedOn} concursos
              </Badge>
            )}
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {games.map((g, i) => (
              <GameCard key={i} game={g} index={i} tone={tone} />
            ))}
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            A <strong>afinidade</strong> mede o quanto cada jogo segue os
            padrões estatísticos aprendidos pelo modelo — não representa
            chance de ganhar. Todo sorteio é aleatório; jogue com
            responsabilidade.
          </p>
        </div>
      )}
    </div>
  );
}
