"use client";

import type { Draw, LotteryConfig } from "@/lib/lotteries";
import { Ball } from "./ball";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function formatDate(iso: string): string {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : iso;
}

export function HistoryView({
  draws,
  cfg,
}: {
  draws: Draw[];
  cfg: LotteryConfig;
}) {
  const tone = cfg.colorVar;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Últimos concursos — {cfg.name}</CardTitle>
        <CardDescription>
          {draws.length} concursos mais recentes — do mais novo ao mais antigo
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col divide-y">
          {draws.map((d) => (
            <div
              key={d.contest}
              className="flex flex-wrap items-center gap-x-4 gap-y-2 py-2.5"
            >
              <div className="w-32 shrink-0">
                <p className="text-sm font-semibold tabular-nums">
                  Concurso {d.contest}
                </p>
                <p className="text-xs text-muted-foreground tabular-nums">
                  {formatDate(d.date)}
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {d.numbers.map((n) => (
                  <Ball key={n} n={n} tone={tone} size="sm" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
