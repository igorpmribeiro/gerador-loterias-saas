"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Trophy,
  Hash,
  Sparkles,
} from "lucide-react";
import { useApiResource } from "@/hooks/use-api-resource";
import { LOTTERIES, type LotteryId } from "@/lib/lotteries";
import type { SavedGameDetail } from "@/lib/saved-games";
import type { GameStats } from "@/lib/game-stats";
import { PageHeader } from "./page-header";
import { Ball } from "./ball";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SavedGameDetailModal } from "./saved-game-detail-modal";

function formatBRL(n: number): string {
  return n.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatDate(iso: string): string {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : iso;
}

function KpiCard({
  label,
  value,
  icon: Icon,
  tone = "neutral",
  hint,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  tone?: "neutral" | "positive" | "negative";
  hint?: string;
}) {
  const valueClass =
    tone === "positive"
      ? "text-emerald-600 dark:text-emerald-400"
      : tone === "negative"
        ? "text-rose-600 dark:text-rose-400"
        : "";
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <Icon className="size-4 text-muted-foreground" />
        </div>
        <p className={`mt-2 text-2xl font-semibold tabular-nums ${valueClass}`}>
          {value}
        </p>
        {hint && (
          <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p>
        )}
      </CardContent>
    </Card>
  );
}

function PerformanceCenter({ stats }: { stats: GameStats }) {
  const balanceTone =
    stats.balance > 0
      ? "positive"
      : stats.balance < 0
        ? "negative"
        : "neutral";
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Total apostado"
          value={formatBRL(stats.totalSpent)}
          icon={Wallet}
          hint={`${stats.drawsEvaluated} concursos avaliados`}
        />
        <KpiCard
          label="Total ganho"
          value={formatBRL(stats.totalWon)}
          icon={Trophy}
          tone={stats.totalWon > 0 ? "positive" : "neutral"}
        />
        <KpiCard
          label="Saldo"
          value={formatBRL(stats.balance)}
          icon={stats.balance >= 0 ? TrendingUp : TrendingDown}
          tone={balanceTone}
        />
        <KpiCard
          label="ROI"
          value={`${stats.roi.toFixed(1)}%`}
          icon={Sparkles}
          tone={stats.roi > 0 ? "positive" : stats.roi < 0 ? "negative" : "neutral"}
          hint={`${stats.gamesCount} jogos no período`}
        />
      </div>

      {stats.byTier.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Faixas premiadas</CardTitle>
            <CardDescription>
              Quantos acertos você bateu em cada faixa no período.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Loteria</TableHead>
                  <TableHead>Faixa</TableHead>
                  <TableHead className="text-right">Vezes</TableHead>
                  <TableHead className="text-right">Total ganho</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.byTier.map((t) => (
                  <TableRow key={`${t.lottery}-${t.hits}`}>
                    <TableCell>{LOTTERIES[t.lottery].name}</TableCell>
                    <TableCell>{t.label}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {t.count}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatBRL(t.totalPrize)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {stats.byDay.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Gasto vs. ganho por dia</CardTitle>
            <CardDescription>
              Cada barra é um dia com concurso avaliado dentro da janela.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DailyBars points={stats.byDay} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function DailyBars({ points }: { points: GameStats["byDay"] }) {
  const max = Math.max(1, ...points.flatMap((p) => [p.spent, p.won]));
  return (
    <div className="flex flex-col gap-2">
      {points.map((p) => (
        <div key={p.date} className="flex items-center gap-3 text-xs">
          <span className="w-20 shrink-0 tabular-nums text-muted-foreground">
            {formatDate(p.date)}
          </span>
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-rose-500/70"
                  style={{ width: `${(p.spent / max) * 100}%` }}
                />
              </div>
              <span className="w-24 text-right tabular-nums text-muted-foreground">
                gastou {formatBRL(p.spent)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-emerald-500/70"
                  style={{ width: `${(p.won / max) * 100}%` }}
                />
              </div>
              <span className="w-24 text-right tabular-nums text-muted-foreground">
                ganhou {formatBRL(p.won)}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function GameStatusBadge({ game }: { game: SavedGameDetail }) {
  if (game.results.length === 0) {
    return <Badge variant="warning">Aguardando</Badge>;
  }
  const cfg = LOTTERIES[game.lottery];
  const minTier = Math.min(...cfg.prizeTiers.map((t) => t.hits));
  const prized = game.totalWon > 0 || (game.best && game.best.hits >= minTier);
  if (prized) {
    return <Badge variant="success">Premiado</Badge>;
  }
  if (game.pending > 0) {
    return <Badge variant="secondary">Em andamento</Badge>;
  }
  return <Badge variant="outline">Conferido</Badge>;
}

function GamesTable({
  games,
  onSelect,
}: {
  games: SavedGameDetail[];
  onSelect: (id: string) => void;
}) {
  if (games.length === 0) {
    return (
      <div className="rounded-lg border border-dashed bg-card/40 p-8 text-center">
        <p className="text-sm text-muted-foreground">
          Você ainda não salvou nenhum jogo com esses filtros.
        </p>
        <Button asChild variant="outline" size="sm" className="mt-3">
          <Link href="/avaliador">Ir para o avaliador</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Loteria</TableHead>
            <TableHead>Dezenas</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Concursos</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Melhor</TableHead>
            <TableHead className="text-right">Saldo</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {games.map((g) => {
            const cfg = LOTTERIES[g.lottery];
            const evaluatedCost = g.results.length * g.costPerDraw;
            const saldo = g.totalWon - evaluatedCost;
            const hasResults = g.results.length > 0;
            return (
              <TableRow
                key={g.id}
                className="cursor-pointer hover:bg-muted/30"
                onClick={() => onSelect(g.id)}
              >
                <TableCell className="font-medium">{cfg.name}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {g.numbers.map((n) => (
                      <Ball key={n} n={n} tone={cfg.colorVar} size="xs" />
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  {g.kind === "teimosinha" ? "Teimosinha" : "Único"}
                </TableCell>
                <TableCell className="tabular-nums">
                  {g.startContest === g.endContest
                    ? g.startContest
                    : `${g.startContest}–${g.endContest}`}
                </TableCell>
                <TableCell>
                  <GameStatusBadge game={g} />
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {g.best ? `${g.best.hits} pts` : "—"}
                </TableCell>
                <TableCell
                  className={
                    "text-right tabular-nums " +
                    (!hasResults
                      ? "text-muted-foreground"
                      : saldo > 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : saldo < 0
                          ? "text-rose-600 dark:text-rose-400"
                          : "text-muted-foreground")
                  }
                >
                  {hasResults ? formatBRL(saldo) : "—"}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

const WINDOWS = [7, 15, 30] as const;
type WindowDays = (typeof WINDOWS)[number];

export function MyGamesView({ userName }: { userName: string }) {
  const [windowDays, setWindowDays] = useState<WindowDays>(30);
  const [lotteryFilter, setLotteryFilter] = useState<"all" | LotteryId>("all");
  const [kindFilter, setKindFilter] = useState<"all" | "single" | "teimosinha">(
    "all"
  );
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);

  const statsUrl = `/api/games/stats?window=${windowDays}`;
  const gamesUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (lotteryFilter !== "all") params.set("lottery", lotteryFilter);
    if (kindFilter !== "all") params.set("kind", kindFilter);
    const q = params.toString();
    return q ? `/api/games?${q}` : "/api/games";
  }, [lotteryFilter, kindFilter]);

  const stats = useApiResource<GameStats>(statsUrl);
  const games = useApiResource<{ games: SavedGameDetail[] }>(gamesUrl);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={`Meus jogos`}
        description={`Olá, ${userName}. Acompanhe seus jogos salvos, faixas premiadas e saldo financeiro.`}
      />

      <Tabs
        value={String(windowDays)}
        onValueChange={(v) => setWindowDays(Number(v) as WindowDays)}
      >
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium">Central de performance</p>
          <TabsList>
            {WINDOWS.map((w) => (
              <TabsTrigger key={w} value={String(w)}>
                {w} dias
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
      </Tabs>

      {stats.loading ? (
        <Skeleton className="h-28 w-full" />
      ) : stats.error ? (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {stats.error}
        </p>
      ) : stats.data ? (
        <PerformanceCenter stats={stats.data} />
      ) : null}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-medium">Seus jogos</p>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={lotteryFilter}
            onValueChange={(v) => setLotteryFilter(v as "all" | LotteryId)}
          >
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as loterias</SelectItem>
              <SelectItem value="megasena">Mega-Sena</SelectItem>
              <SelectItem value="lotofacil">Lotofácil</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={kindFilter}
            onValueChange={(v) =>
              setKindFilter(v as "all" | "single" | "teimosinha")
            }
          >
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              <SelectItem value="single">Único</SelectItem>
              <SelectItem value="teimosinha">Teimosinha</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {games.loading ? (
        <Skeleton className="h-40 w-full" />
      ) : games.error ? (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {games.error}
        </p>
      ) : games.data ? (
        <GamesTable
          games={games.data.games}
          onSelect={(id) => setSelectedGameId(id)}
        />
      ) : null}

      <p className="text-[11px] leading-relaxed text-muted-foreground">
        Saldo = ganhos − custo total dos concursos da janela já avaliados.
        Concursos ainda não sorteados não entram no cálculo. <Hash className="ml-1 inline size-3" />
      </p>

      <SavedGameDetailModal
        gameId={selectedGameId}
        open={selectedGameId !== null}
        onOpenChange={(o) => {
          if (!o) setSelectedGameId(null);
        }}
      />
    </div>
  );
}
