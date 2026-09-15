import type { DistributionBucket } from "@/lib/analysis";
import { cn } from "@/lib/utils";

/**
 * Distribuição em barras horizontais.
 *
 * Uma cor só. A paleta antiga dava um tom diferente a cada gráfico
 * (`chart-1`…`chart-5` + `primary`) sem que a cor significasse nada: somas
 * saíam azuis, consecutivos saíam em vermelho-salmão — que o olho lê como
 * alerta — e faixas saíam no verde reservado às ações. Aqui a cor codifica
 * uma única coisa: qual é a faixa mais frequente.
 */
export function DistBar({
  data,
  highlightMax = true,
  className,
}: {
  data: DistributionBucket[];
  highlightMax?: boolean;
  className?: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {data.map((d) => {
        const isMax = highlightMax && d.count === max;
        return (
          <div key={d.label} className="flex items-center gap-2 text-xs">
            <span className="w-20 shrink-0 tabular-nums text-muted-foreground sm:w-24">
              {d.label}
            </span>
            <div className="relative h-5 flex-1 overflow-hidden rounded bg-muted">
              <div
                className={cn(
                  "h-full rounded transition-all",
                  isMax ? "bg-brand" : "bg-foreground/25"
                )}
                style={{ width: `${(d.count / max) * 100}%` }}
              />
            </div>
            <span
              className={cn(
                "w-12 shrink-0 text-right tabular-nums sm:w-14",
                isMax ? "font-medium text-foreground" : "text-muted-foreground"
              )}
            >
              {d.percentage.toFixed(1)}%
            </span>
          </div>
        );
      })}
    </div>
  );
}
