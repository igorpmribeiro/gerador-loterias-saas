"use client";

import { Loader2, RefreshCw, RotateCw } from "lucide-react";
import type { DrawRow } from "@/lib/draw-table";
import type { CycleSummary } from "@/lib/cycles";
import type { LotteryConfig } from "@/lib/lotteries";
import { useApiResource } from "@/hooks/use-api-resource";
import { Ball } from "./ball";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

function formatDate(iso: string): string {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? `${m[3]}/${m[2]}` : iso;
}

function CyclePanel({ cycle }: { cycle: CycleSummary }) {
  const { current, stats, recent, closedCount } = cycle;
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <RotateCw className="size-4 text-lotofacil" />
          <CardTitle>Ciclo atual da Lotofácil</CardTitle>
        </div>
        <CardDescription>
          Um ciclo fecha quando todas as 25 dezenas são sorteadas. As dezenas
          que ainda não saíram são candidatas fortes a fechá-lo.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid gap-3 sm:grid-cols-4">
          <Stat label="Ciclo nº" value={`${current.index}`} />
          <Stat label="Concursos no ciclo" value={`${current.contests}`} />
          <Stat
            label="Dezenas já sorteadas"
            value={`${current.drawn.length}/${cycle.universe}`}
          />
          <Stat
            label="Faltam fechar"
            value={`${current.missing.length}`}
            highlight
          />
        </div>

        <div>
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            Dezenas que ainda NÃO saíram no ciclo {current.index}
          </p>
          {current.missing.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {current.missing.map((n) => (
                <Ball key={n} n={n} tone="lotofacil" size="sm" />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Todas as dezenas saíram — o ciclo está prestes a reiniciar.
            </p>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Stat
            label="Duração média"
            value={`${stats.avg.toFixed(1)} concursos`}
          />
          <Stat label="Ciclo mais curto" value={`${stats.min}`} />
          <Stat label="Ciclo mais longo" value={`${stats.max}`} />
        </div>

        <div>
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            Últimos ciclos fechados ({closedCount} no total)
          </p>
          <div className="flex flex-wrap gap-2">
            {recent.map((c) => (
              <div
                key={c.index}
                className="rounded-lg border bg-card px-2.5 py-1.5 text-xs"
              >
                <span className="font-semibold">#{c.index}</span>{" "}
                <span className="text-muted-foreground">
                  {c.contests} concursos
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Stat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={`text-lg font-semibold tabular-nums ${
          highlight ? "text-lotofacil" : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}

interface TablePayload {
  rows: DrawRow[];
  cycle: CycleSummary | null;
}

export function TableView({ cfg }: { cfg: LotteryConfig }) {
  const { data, loading, error, reload } = useApiResource<TablePayload>(
    `/api/table?lottery=${cfg.id}&limit=20`
  );

  const tone = cfg.colorVar;
  const isLotofacil = cfg.id === "lotofacil";
  const rows = data?.rows ?? [];
  const cycle = data?.cycle ?? null;

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-20 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Carregando tabela...
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button onClick={reload} variant="outline" size="sm">
            <RefreshCw />
            Tentar novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {isLotofacil && cycle && <CyclePanel cycle={cycle} />}

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle>Últimos 20 concursos — {cfg.name}</CardTitle>
              <CardDescription>
                Tabela analítica concurso a concurso
              </CardDescription>
            </div>
            <Badge variant="secondary">{rows.length} concursos</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b text-xs text-muted-foreground">
                  <Th>Conc.</Th>
                  <Th>Data</Th>
                  <Th className="min-w-[260px]">Dezenas</Th>
                  <Th align="center">Soma</Th>
                  <Th align="center">P/Í</Th>
                  <Th align="center">Primos</Th>
                  {isLotofacil && <Th align="center">Moldura</Th>}
                  {isLotofacil && <Th align="center">Miolo</Th>}
                  <Th align="center">Seq.</Th>
                  <Th align="center">Rep.</Th>
                  <Th align="center">Ampl.</Th>
                  {isLotofacil && <Th align="center">Ciclo</Th>}
                  {isLotofacil && <Th align="center">Faltavam</Th>}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr
                    key={r.contest}
                    className="border-b last:border-0 hover:bg-accent/40"
                  >
                    <Td className="font-semibold tabular-nums">
                      {r.contest}
                    </Td>
                    <Td className="tabular-nums text-muted-foreground">
                      {formatDate(r.date)}
                    </Td>
                    <Td>
                      <div className="flex flex-wrap gap-1 py-1">
                        {r.numbers.map((n) => (
                          <Ball key={n} n={n} tone={tone} size="sm" />
                        ))}
                      </div>
                    </Td>
                    <Td align="center" className="tabular-nums">
                      {r.sum}
                    </Td>
                    <Td align="center" className="tabular-nums">
                      {r.even}/{r.odd}
                    </Td>
                    <Td align="center" className="tabular-nums">
                      {r.primes}
                    </Td>
                    {isLotofacil && (
                      <Td align="center" className="tabular-nums">
                        {r.frame}
                      </Td>
                    )}
                    {isLotofacil && (
                      <Td align="center" className="tabular-nums">
                        {r.center}
                      </Td>
                    )}
                    <Td align="center" className="tabular-nums">
                      {r.maxRun}
                    </Td>
                    <Td align="center" className="tabular-nums">
                      {r.repeatsFromPrev ?? "—"}
                    </Td>
                    <Td align="center" className="tabular-nums">
                      {r.amplitude}
                    </Td>
                    {isLotofacil && (
                      <Td align="center" className="tabular-nums">
                        {r.cycle}
                      </Td>
                    )}
                    {isLotofacil && (
                      <Td align="center" className="tabular-nums">
                        {r.cycleMissingAfter}
                      </Td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span>
              <strong>Seq.</strong> maior sequência consecutiva
            </span>
            <span>
              <strong>Rep.</strong> dezenas repetidas do concurso anterior
            </span>
            <span>
              <strong>Ampl.</strong> maior dezena − menor dezena
            </span>
            {isLotofacil && (
              <>
                <span>
                  <strong>Moldura/Miolo</strong> borda × centro do volante 5×5
                </span>
                <span>
                  <strong>Faltavam</strong> dezenas restantes para fechar o
                  ciclo
                </span>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Th({
  children,
  align = "left",
  className = "",
}: {
  children?: React.ReactNode;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <th
      className={`px-2 py-2 font-medium ${
        align === "center" ? "text-center" : "text-left"
      } ${className}`}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  align = "left",
  className = "",
}: {
  children?: React.ReactNode;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <td
      className={`px-2 py-1.5 ${
        align === "center" ? "text-center" : "text-left"
      } ${className}`}
    >
      {children}
    </td>
  );
}
