"use client";

import type { LotteryConfig } from "@/lib/lotteries";
import { cn } from "@/lib/utils";

/**
 * Réplica do volante (canhoto) da loteria. O cliente marca dezenas
 * clicando nas células; o número de marcações é limitado a `drawSize`.
 */
export function LotterySlip({
  cfg,
  selected,
  onToggle,
  disabled = false,
}: {
  cfg: LotteryConfig;
  selected: number[];
  onToggle: (n: number) => void;
  disabled?: boolean;
}) {
  const sel = new Set(selected);
  const full = selected.length >= cfg.drawSize;

  const numbers: number[] = [];
  for (let n = cfg.min; n <= cfg.max; n++) numbers.push(n);

  return (
    <div
      className="grid w-fit gap-1 sm:gap-1.5"
      style={{
        gridTemplateColumns: `repeat(${cfg.grid.cols}, auto)`,
      }}
    >
      {numbers.map((n) => {
        const on = sel.has(n);
        const blocked = disabled || (!on && full);
        return (
          <button
            key={n}
            type="button"
            onClick={() => onToggle(n)}
            disabled={blocked}
            aria-pressed={on}
            aria-label={`Dezena ${n}`}
            className={cn(
              "flex size-7 items-center justify-center rounded-md border text-xs font-semibold tabular-nums transition-colors sm:size-8 sm:text-sm md:size-9",
              on && cfg.colorVar === "mega" &&
                "border-mega bg-mega text-mega-foreground shadow-sm",
              on && cfg.colorVar === "lotofacil" &&
                "border-lotofacil bg-lotofacil text-lotofacil-foreground shadow-sm",
              !on &&
                !blocked &&
                "border-border bg-card hover:border-foreground/30 hover:bg-secondary",
              !on &&
                blocked &&
                "cursor-not-allowed border-dashed bg-card text-muted-foreground/40"
            )}
          >
            {n.toString().padStart(2, "0")}
          </button>
        );
      })}
    </div>
  );
}
