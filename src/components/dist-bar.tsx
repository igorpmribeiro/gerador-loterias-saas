import type { DistributionBucket } from "@/lib/analysis";
import { cn } from "@/lib/utils";

export function DistBar({
  data,
  accent = "bg-primary",
  highlightMax = true,
}: {
  data: DistributionBucket[];
  accent?: string;
  highlightMax?: boolean;
}) {
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <div className="flex flex-col gap-1.5">
      {data.map((d) => {
        const isMax = highlightMax && d.count === max;
        return (
          <div key={d.label} className="flex items-center gap-2 text-xs">
            <span className="w-24 shrink-0 text-muted-foreground tabular-nums">
              {d.label}
            </span>
            <div className="relative h-5 flex-1 overflow-hidden rounded bg-muted">
              <div
                className={cn(
                  "h-full rounded transition-all",
                  accent,
                  isMax ? "opacity-100" : "opacity-55"
                )}
                style={{ width: `${(d.count / max) * 100}%` }}
              />
            </div>
            <span className="w-14 shrink-0 text-right tabular-nums text-muted-foreground">
              {d.percentage.toFixed(1)}%
            </span>
          </div>
        );
      })}
    </div>
  );
}
