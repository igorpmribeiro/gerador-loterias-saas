"use client";

import { useMemo, useState } from "react";
import { Loader2, Layers, Wand2, Download, Trash2 } from "lucide-react";
import type { LotteryConfig } from "@/lib/lotteries";
import type { WheelMode, WheelResult } from "@/lib/wheeling";
import { WHEEL_LIMITS } from "@/lib/wheeling";
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
import { cn } from "@/lib/utils";

const MAX_RENDERED = 120;

function brl(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function WheelView({ cfg }: { cfg: LotteryConfig }) {
  const limits = WHEEL_LIMITS[cfg.id];
  const tone = cfg.colorVar;

  const [mode, setMode] = useState<WheelMode>("reduced");
  const [guarantee, setGuarantee] = useState(
    limits.reduced.guarantees[limits.reduced.guarantees.length - 1]
  );
  const [pool, setPool] = useState<Set<number>>(new Set());
  const [suggestSize, setSuggestSize] = useState(limits.reduced.min);
  const [result, setResult] = useState<WheelResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const range = mode === "full" ? limits.full : limits.reduced;
  const poolList = useMemo(
    () => [...pool].sort((a, b) => a - b),
    [pool]
  );
  const poolValid =
    poolList.length >= range.min && poolList.length <= range.max;

  function toggle(n: number) {
    setPool((prev) => {
      const next = new Set(prev);
      if (next.has(n)) next.delete(n);
      else next.add(n);
      return next;
    });
  }

  async function suggest() {
    setSuggesting(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/wheel?lottery=${cfg.id}&size=${suggestSize}`
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "falha ao sugerir");
      setPool(new Set<number>(json.pool));
    } catch (err) {
      setError(err instanceof Error ? err.message : "erro inesperado");
    } finally {
      setSuggesting(false);
    }
  }

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/wheel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lottery: cfg.id,
          pool: poolList,
          mode,
          guarantee: mode === "reduced" ? guarantee : undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "falha no fechamento");
      setResult(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "erro inesperado");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  function downloadTxt() {
    if (!result) return;
    const text = result.games
      .map((g) => g.map((n) => n.toString().padStart(2, "0")).join(" "))
      .join("\n");
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fechamento-${cfg.id}-${result.gameCount}-jogos.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const suggestSizes: number[] = [];
  for (let s = range.min; s <= range.max; s++) suggestSizes.push(s);

  return (
    <div className="flex flex-col gap-4">
      <InfoPanel title="Como funciona o fechamento — e como aproveitá-lo melhor">
        <p>
          No fechamento você escolhe um <strong>grupo de dezenas maior</strong>{" "}
          que uma aposta comum ({cfg.drawSize} dezenas) e o sistema distribui
          essas dezenas em vários jogos combinados — aumentando a chance de
          cravar uma faixa de premiação.
        </p>
        <ul className="ml-4 list-disc space-y-1">
          <li>
            <strong>Completo:</strong> gera todas as combinações possíveis do
            grupo. Se as {cfg.drawSize} dezenas sorteadas estiverem no grupo, o
            prêmio máximo é certo — mas a quantidade de jogos (e o custo) cresce
            muito rápido a cada dezena adicionada.
          </li>
          <li>
            <strong>Reduzido:</strong> gera bem menos jogos mantendo uma
            garantia matemática. Ex.: uma garantia de 13 acertos significa que,
            se 13 ou mais das dezenas sorteadas caírem no seu grupo, ao menos um
            jogo terá 13 acertos.
          </li>
          <li>
            A garantia só vale <strong>dentro do seu grupo</strong>: se as
            dezenas sorteadas caírem fora dele, não há prêmio garantido.
          </li>
        </ul>
        <p className="font-medium text-foreground">Dicas para usar bem:</p>
        <ul className="ml-4 list-disc space-y-1">
          <li>
            Comece com um grupo de 1 a 3 dezenas acima do tamanho da aposta — o
            custo sobe bastante a cada dezena extra.
          </li>
          <li>
            Use <strong>“Sugerir grupo com IA”</strong> para partir de uma
            seleção embasada nos dados e depois ajuste as dezenas em que você
            confia.
          </li>
          <li>
            Garantias menores geram menos jogos e custam menos; garantias
            maiores trazem mais segurança e mais jogos. Equilibre com o seu
            orçamento.
          </li>
        </ul>
      </InfoPanel>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Layers className="size-4 text-primary" />
            <CardTitle>Montar fechamento</CardTitle>
          </div>
          <CardDescription>
            Selecione o grupo de dezenas, escolha o modo e gere as combinações.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {/* Modo */}
          <div className="flex flex-wrap gap-2">
            <ModeButton
              active={mode === "reduced"}
              onClick={() => setMode("reduced")}
              title="Reduzido com garantia"
              subtitle="Menos jogos, com garantia matemática"
            />
            <ModeButton
              active={mode === "full"}
              onClick={() => setMode("full")}
              title="Completo"
              subtitle="Todas as combinações do grupo"
            />
          </div>

          {/* Controles */}
          <div className="grid gap-3 sm:grid-cols-3">
            {mode === "reduced" && (
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-muted-foreground">
                  Garantia de acertos
                </span>
                <Select
                  value={String(guarantee)}
                  onValueChange={(v) => setGuarantee(Number(v))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {limits.reduced.guarantees.map((g) => (
                      <SelectItem key={g} value={String(g)}>
                        {g} acertos garantidos
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>
            )}
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">
                Tamanho do grupo (sugestão IA)
              </span>
              <Select
                value={String(suggestSize)}
                onValueChange={(v) => setSuggestSize(Number(v))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {suggestSizes.map((s) => (
                    <SelectItem key={s} value={String(s)}>
                      {s} dezenas
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={suggest}
                disabled={suggesting}
                className="w-full"
              >
                {suggesting ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <Wand2 />
                )}
                Sugerir grupo com IA
              </Button>
            </div>
          </div>

          {/* Seletor de dezenas */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                Selecione o grupo —{" "}
                <span
                  className={cn(
                    "font-semibold",
                    poolValid ? "text-emerald-600" : "text-foreground"
                  )}
                >
                  {poolList.length}
                </span>{" "}
                de {range.min}–{range.max} dezenas
              </span>
              {pool.size > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPool(new Set())}
                >
                  <Trash2 />
                  Limpar
                </Button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {Array.from(
                { length: cfg.max - cfg.min + 1 },
                (_, i) => i + cfg.min
              ).map((n) => {
                const selected = pool.has(n);
                return (
                  <button
                    key={n}
                    onClick={() => toggle(n)}
                    aria-pressed={selected}
                    className={cn(
                      "flex size-9 items-center justify-center rounded-full text-xs font-semibold tabular-nums transition-colors",
                      selected
                        ? tone === "mega"
                          ? "bg-mega text-mega-foreground"
                          : "bg-lotofacil text-lotofacil-foreground"
                        : "bg-muted text-muted-foreground hover:bg-accent"
                    )}
                  >
                    {n.toString().padStart(2, "0")}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={generate}
              disabled={loading || !poolValid}
              size="lg"
            >
              {loading ? <Loader2 className="animate-spin" /> : <Layers />}
              {loading ? "Calculando..." : "Gerar fechamento"}
            </Button>
            {!poolValid && poolList.length > 0 && (
              <p className="text-xs text-muted-foreground">
                Ajuste o grupo para {range.min}–{range.max} dezenas.
              </p>
            )}
          </div>

          {error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}
        </CardContent>
      </Card>

      {result && <WheelResultCard result={result} cfg={cfg} tone={tone} onDownload={downloadTxt} />}
    </div>
  );
}

function WheelResultCard({
  result,
  cfg,
  tone,
  onDownload,
}: {
  result: WheelResult;
  cfg: LotteryConfig;
  tone: "mega" | "lotofacil";
  onDownload: () => void;
}) {
  const reduction =
    result.fullCount > 0
      ? Math.round((1 - result.gameCount / result.fullCount) * 100)
      : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle>
            {result.gameCount} jogos · {result.pool.length} dezenas
          </CardTitle>
          <Button variant="outline" size="sm" onClick={onDownload}>
            <Download />
            Baixar .txt
          </Button>
        </div>
        <CardDescription>{result.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid gap-3 sm:grid-cols-4">
          <MiniStat label="Jogos" value={`${result.gameCount}`} />
          <MiniStat
            label="Custo estimado"
            value={brl(result.estimatedCost)}
          />
          <MiniStat
            label="Garantia"
            value={`${result.guarantee} acertos`}
          />
          <MiniStat
            label={
              result.mode === "reduced" ? "Economia vs completo" : "Modo"
            }
            value={
              result.mode === "reduced"
                ? `${reduction}%`
                : "Completo"
            }
          />
        </div>

        <div>
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            Grupo escolhido ({result.pool.length} dezenas)
          </p>
          <div className="flex flex-wrap gap-1.5">
            {result.pool.map((n) => (
              <Ball key={n} n={n} tone={tone} size="sm" />
            ))}
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground">
              Jogos do fechamento
            </p>
            {result.gameCount > MAX_RENDERED && (
              <Badge variant="secondary">
                exibindo {MAX_RENDERED} de {result.gameCount} — baixe o .txt
                para todos
              </Badge>
            )}
          </div>
          <div className="flex max-h-[420px] flex-col gap-1.5 overflow-y-auto rounded-lg border p-2">
            {result.games.slice(0, MAX_RENDERED).map((game, i) => (
              <div
                key={i}
                className="flex items-center gap-2 rounded-md px-1.5 py-1 hover:bg-accent/40"
              >
                <span className="w-8 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                  {i + 1}
                </span>
                <div className="flex flex-wrap gap-1">
                  {game.map((n) => (
                    <Ball key={n} n={n} tone={tone} size="xs" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          A garantia é matemática sobre o seu grupo: ela só se realiza se as
          dezenas sorteadas caírem dentro do grupo escolhido. Custo estimado
          considera a aposta simples de {brl(cfg.betPrice)}. Jogue com
          responsabilidade.
        </p>
      </CardContent>
    </Card>
  );
}

function ModeButton({
  active,
  onClick,
  title,
  subtitle,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  subtitle: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex-1 rounded-lg border p-3 text-left transition-all",
        active
          ? "border-primary bg-primary/5 ring-1 ring-primary"
          : "hover:bg-accent/50"
      )}
    >
      <p className="text-sm font-semibold">{title}</p>
      <p className="text-xs text-muted-foreground">{subtitle}</p>
    </button>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold tabular-nums">{value}</p>
    </div>
  );
}
