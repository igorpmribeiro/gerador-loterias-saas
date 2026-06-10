"use client";

import { useApiResource } from "@/hooks/use-api-resource";
import { useLottery } from "./lottery-context";
import type { NumberDetailStat } from "@/lib/number-analysis";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Ball } from "./ball";
import { Skeleton } from "@/components/ui/skeleton";

function StatTile({
  label,
  value,
  hint,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 font-semibold tabular-nums">{value}</p>
      {hint && (
        <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}

function Sparkline({ data, height = 36 }: { data: number[]; height?: number }) {
  if (data.length < 2) {
    return <div className="h-9 text-xs text-muted-foreground">Sem série suficiente.</div>;
  }
  const width = 240;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = Math.max(1, max - min);
  const stepX = width / (data.length - 1);
  const points = data
    .map((v, i) => `${i * stepX},${height - ((v - min) / span) * height}`)
    .join(" ");
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className="h-9 w-full text-foreground"
      role="img"
      aria-label="Histórico de atrasos do número"
    >
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CompanionRow({
  num,
  count,
  coRate,
  tone,
}: {
  num: number;
  count: number;
  coRate: number;
  tone: "lotofacil" | "muted";
}) {
  return (
    <div className="flex items-center gap-3 rounded-md border bg-card px-2 py-1.5">
      <Ball n={num} tone={tone} size="sm" />
      <div className="flex-1">
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-foreground/30"
            style={{ width: `${Math.min(100, coRate)}%` }}
          />
        </div>
      </div>
      <span className="w-10 text-right text-xs tabular-nums text-muted-foreground">
        {count}x
      </span>
      <span className="w-12 text-right text-[11px] tabular-nums text-muted-foreground">
        {coRate.toFixed(0)}%
      </span>
    </div>
  );
}

function ModalBody({ data }: { data: NumberDetailStat }) {
  const seq = data.sequence;
  const pct = (n: number) =>
    data.count > 0 ? ((n / data.count) * 100).toFixed(0) : "0";

  return (
    <div className="space-y-5">
      {/* Frequência + atraso */}
      <div>
        <p className="mb-2 text-sm font-medium">Frequência e atraso</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <StatTile
            label="Vezes"
            value={data.count}
            hint={`${data.percentage.toFixed(1)}% dos concursos`}
          />
          <StatTile
            label="Atraso atual"
            value={data.currentGap}
            hint={data.lastContest ? `último: nº ${data.lastContest}` : "—"}
          />
          <StatTile
            label="Atraso médio"
            value={data.avgGap.toFixed(1)}
            hint={`±${data.stdevGap.toFixed(1)}`}
          />
          <StatTile label="Maior atraso" value={data.maxGap} />
        </div>
        <div className="mt-3 rounded-lg border bg-card p-3">
          <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
            <span>Série histórica de atrasos</span>
            <span>Mín {Math.min(...data.gapHistory)} · Máx {data.maxGap}</span>
          </div>
          <Sparkline data={data.gapHistory} />
        </div>
      </div>

      {/* Companheiros */}
      <div>
        <p className="mb-2 text-sm font-medium">
          Duplas — quem sai e quem não sai com o nº{" "}
          {data.number.toString().padStart(2, "0")}
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
              Top fortes — combinam muito
            </p>
            {data.companions.strong.map((c) => (
              <CompanionRow
                key={`s-${c.number}`}
                num={c.number}
                count={c.count}
                coRate={c.coRate}
                tone="lotofacil"
              />
            ))}
          </div>
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
              Top fracos — raramente juntos
            </p>
            {data.companions.weak.map((c) => (
              <CompanionRow
                key={`w-${c.number}`}
                num={c.number}
                count={c.count}
                coRate={c.coRate}
                tone="muted"
              />
            ))}
          </div>
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">
          % indica a fração das aparições do alvo em que o companheiro também
          saiu.
        </p>
      </div>

      {/* Sequência */}
      <div>
        <p className="mb-2 text-sm font-medium">Padrão de sequência</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <StatTile
            label="Com anterior"
            value={`${seq.withPrev}`}
            hint={`${pct(seq.withPrev)}% das vezes`}
          />
          <StatTile
            label="Com posterior"
            value={`${seq.withNext}`}
            hint={`${pct(seq.withNext)}% das vezes`}
          />
          <StatTile
            label="Em sequências ≥3"
            value={`${seq.inRunOf3Plus}`}
            hint={`${pct(seq.inRunOf3Plus)}% das vezes`}
          />
          <StatTile
            label="Isolado"
            value={`${seq.isolated}`}
            hint={`${pct(seq.isolated)}% das vezes`}
          />
        </div>
      </div>

      {/* Timeline */}
      <div>
        <div className="mb-2 flex items-end justify-between">
          <p className="text-sm font-medium">Últimas aparições</p>
          <span className="text-xs text-muted-foreground">
            {data.timeline.length} mais recentes
          </span>
        </div>
        <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-6">
          {data.timeline.map((t) => (
            <div
              key={t.contest}
              className="rounded-md border bg-card p-2 text-center"
              title={t.date}
            >
              <p className="text-xs font-semibold tabular-nums">{t.contest}</p>
              <p className="text-[10px] text-muted-foreground">
                +{t.gapFromPrevious}
              </p>
            </div>
          ))}
        </div>
      </div>

      <p className="text-[11px] leading-relaxed text-muted-foreground">
        Análise descritiva do histórico. Loteria é jogo de azar — números que
        saem juntos com frequência continuam tendo a mesma chance no próximo
        sorteio.
      </p>
    </div>
  );
}

export function NumberDetailModal({
  number,
  open,
  onOpenChange,
}: {
  number: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { lottery, dataVersion } = useLottery();
  const enabled = open && number != null && lottery === "lotofacil";
  const url = enabled
    ? `/api/analysis/number?lottery=${lottery}&number=${number}&window=all`
    : "";
  const { data, loading, error } = useApiResource<NumberDetailStat>(
    url,
    dataVersion
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            {number != null && (
              <Ball n={number} tone="lotofacil" size="lg" />
            )}
            <div>
              <DialogTitle>
                Análise do nº {number?.toString().padStart(2, "0") ?? "—"}
              </DialogTitle>
              <DialogDescription>
                {data
                  ? `${data.totalDraws} concursos analisados (nº ${data.range.firstContest} ao ${data.range.lastContest})`
                  : "Padrões individuais para apoiar sua escolha."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {loading && (
          <div className="space-y-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        )}

        {error && (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {data && !loading && <ModalBody data={data} />}
      </DialogContent>
    </Dialog>
  );
}
