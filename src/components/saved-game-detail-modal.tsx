"use client";

import { useApiResource } from "@/hooks/use-api-resource";
import type { SavedGameDetail } from "@/lib/saved-games";
import { LOTTERIES } from "@/lib/lotteries";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Ball } from "./ball";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

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

function Body({ game }: { game: SavedGameDetail }) {
  const cfg = LOTTERIES[game.lottery];
  const minTier = Math.min(...cfg.prizeTiers.map((t) => t.hits));

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="text-sm font-medium">Suas dezenas</p>
        <div className="flex flex-wrap gap-1.5">
          {game.numbers.map((n) => (
            <Ball key={n} n={n} tone={cfg.colorVar} size="sm" />
          ))}
        </div>
        {game.notes && (
          <p className="text-xs text-muted-foreground italic">
            “{game.notes}”
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="Custo total" value={formatBRL(game.totalCost)} />
        <Stat
          label="Ganho até agora"
          value={formatBRL(game.totalWon)}
          highlight={game.totalWon > 0}
        />
        <Stat
          label="Saldo"
          value={formatBRL(game.totalWon - game.totalCost)}
          highlight={game.totalWon - game.totalCost >= 0}
        />
        <Stat
          label="Melhor acerto"
          value={game.best ? `${game.best.hits} pts` : "—"}
          hint={game.best ? `concurso ${game.best.contest}` : undefined}
        />
      </div>

      <div>
        <p className="mb-2 text-sm font-medium">
          Concursos da janela ({game.startContest}–{game.endContest})
        </p>
        {game.results.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum concurso da janela foi sorteado ainda. Volte depois.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Concurso</th>
                  <th className="px-3 py-2 text-left font-medium">Acertos</th>
                  <th className="px-3 py-2 text-left font-medium">Faixa</th>
                  <th className="px-3 py-2 text-right font-medium">Prêmio</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {game.results.map((r) => {
                  const tierCfg = cfg.prizeTiers.find(
                    (t) => t.hits === r.hits
                  );
                  const prized = r.hits >= minTier;
                  return (
                    <tr key={r.contest}>
                      <td className="px-3 py-2 tabular-nums">{r.contest}</td>
                      <td className="px-3 py-2 tabular-nums font-semibold">
                        {r.hits}
                      </td>
                      <td className="px-3 py-2">
                        {prized && tierCfg ? (
                          <Badge variant="success">{tierCfg.label}</Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {r.prizeAmount != null
                          ? formatBRL(r.prizeAmount)
                          : prized
                            ? "—"
                            : ""}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {game.pending > 0 && (
          <p className="mt-2 text-xs text-muted-foreground">
            {game.pending}{" "}
            {game.pending === 1
              ? "concurso ainda não sorteado"
              : "concursos ainda não sorteados"}
            .
          </p>
        )}
      </div>

      <p className="text-[11px] text-muted-foreground">
        Criado em {formatDate(game.createdAt.slice(0, 10))} ·{" "}
        {game.kind === "teimosinha" ? "Teimosinha" : "Jogo único"} ·{" "}
        {cfg.name}
      </p>
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
  highlight,
}: {
  label: string;
  value: string;
  hint?: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p
        className={
          "mt-1 font-semibold tabular-nums " +
          (highlight ? "text-emerald-600 dark:text-emerald-400" : "")
        }
      >
        {value}
      </p>
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function SavedGameDetailModal({
  gameId,
  open,
  onOpenChange,
}: {
  gameId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const url = open && gameId ? `/api/games/${gameId}` : "";
  const { data, loading, error } = useApiResource<{ game: SavedGameDetail }>(
    url
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Detalhes do jogo</DialogTitle>
          <DialogDescription>
            Acertos por concurso, prêmios e saldo da janela.
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        )}

        {error && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        {data && !loading && <Body game={data.game} />}
      </DialogContent>
    </Dialog>
  );
}
