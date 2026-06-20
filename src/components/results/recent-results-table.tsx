import { Ball } from "@/components/ball";
import { formatDate } from "@/lib/format";
import type { Draw, LotteryConfig } from "@/lib/lotteries";

/** Tabela dos concursos mais recentes — concurso, data e dezenas sorteadas. */
export function RecentResultsTable({
  draws,
  tone,
}: {
  draws: Draw[];
  tone: LotteryConfig["colorVar"];
}) {
  if (draws.length === 0) return null;

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-secondary/50 text-xs text-muted-foreground">
            <th className="px-3 py-2 text-left font-medium">Concurso</th>
            <th className="px-3 py-2 text-left font-medium">Data</th>
            <th className="px-3 py-2 text-left font-medium">Dezenas</th>
          </tr>
        </thead>
        <tbody>
          {draws.map((d) => (
            <tr key={d.contest} className="border-b last:border-0">
              <td className="px-3 py-2 align-middle font-medium tnum">
                {d.contest}
              </td>
              <td className="whitespace-nowrap px-3 py-2 align-middle text-muted-foreground tnum">
                {formatDate(d.date)}
              </td>
              <td className="px-3 py-2">
                <div className="flex flex-wrap gap-1">
                  {d.numbers.map((n) => (
                    <Ball key={n} n={n} tone={tone} size="xs" />
                  ))}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
